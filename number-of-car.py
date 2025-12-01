import cv2
import numpy as np
from ultralytics import YOLO
import argparse
from collections import defaultdict
import time
import sys

class VehicleCounter:
    def __init__(self, model_path='yolov8n.pt', confidence_threshold=0.3):
        """
        Initialize the vehicle counter with YOLO model
        
        Args:
            model_path (str): Path to YOLO model weights
            confidence_threshold (float): Minimum confidence for detections
        """
        # Load YOLO model
        self.model = YOLO(model_path)
        self.confidence_threshold = confidence_threshold
        
        # Vehicle class IDs from COCO dataset
        self.vehicle_classes = {
            2: 'car',
            3: 'motorcycle', 
            5: 'bus',
            7: 'truck'
        }
        
        # Tracking variables
        self.track_history = defaultdict(lambda: [])
        self.vehicle_count = defaultdict(int)
        self.total_vehicles = 0
        
        # Line for counting (you can adjust these coordinates)
        self.counting_line_y = None
        self.counted_ids = set()
        
    def setup_counting_line(self, frame_height, line_position=0.5):
        """
        Setup the counting line position
        
        Args:
            frame_height (int): Height of the video frame
            line_position (float): Position of line as fraction of frame height (0.5 = middle)
        """
        self.counting_line_y = int(frame_height * line_position)
        
    def draw_counting_line(self, frame):
        """Draw the counting line on the frame"""
        if self.counting_line_y is not None:
            cv2.line(frame, (0, self.counting_line_y), 
                    (frame.shape[1], self.counting_line_y), (0, 255, 0), 2)
            cv2.putText(frame, "COUNTING LINE", (10, self.counting_line_y - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    
    def has_crossed_line(self, track_points, track_id):
        """
        Check if a vehicle has crossed the counting line
        
        Args:
            track_points (list): List of center points for the track
            track_id (int): Unique ID of the tracked object
            
        Returns:
            bool: True if vehicle crossed the line
        """
        if len(track_points) < 2 or track_id in self.counted_ids:
            return False
            
        # Check if the vehicle crossed the counting line
        prev_y = track_points[-2][1]
        curr_y = track_points[-1][1]
        
        # Vehicle crossed from top to bottom
        if prev_y < self.counting_line_y <= curr_y:
            self.counted_ids.add(track_id)
            return True
            
        # Vehicle crossed from bottom to top  
        elif prev_y > self.counting_line_y >= curr_y:
            self.counted_ids.add(track_id)
            return True
            
        return False
    
    def process_frame(self, frame):
        """
        Process a single frame for vehicle detection and counting
        
        Args:
            frame: Input video frame
            
        Returns:
            processed_frame: Frame with annotations
        """
        # Run YOLO inference
        results = self.model.track(frame, persist=True, conf=self.confidence_threshold,
                                 classes=list(self.vehicle_classes.keys()))
        
        annotated_frame = frame.copy()
        
        if results[0].boxes is not None and results[0].boxes.id is not None:
            # Get detection boxes, track IDs, and classes
            boxes = results[0].boxes.xywh.cpu()
            track_ids = results[0].boxes.id.int().cpu().tolist()
            class_ids = results[0].boxes.cls.int().cpu().tolist()
            confidences = results[0].boxes.conf.cpu().tolist()
            
            for box, track_id, class_id, conf in zip(boxes, track_ids, class_ids, confidences):
                if class_id in self.vehicle_classes and conf >= 0.5:
                    x, y, w, h = box
                    if w < 30 or h < 30 or w > 400 or h > 400:
                        continue

                    center_point = (int(x), int(y))
                    self.track_history[track_id].append(center_point)
                    if len(self.track_history[track_id]) > 30:
                        self.track_history[track_id].pop(0)

                    movement_threshold = 20  # pixels
                    track_points = self.track_history[track_id]
                    if len(track_points) > 1:
                        dist = np.linalg.norm(np.array(track_points[-1]) - np.array(track_points[0]))
                    else:
                        dist = 0

                    # Count vehicles already past the line at first detection, only if moved
                    if len(track_points) == 1 and track_id not in self.counted_ids:
                        # Don't count if not enough movement yet
                        continue

                    if dist < movement_threshold:
                        continue  # Ignore static objects

                    if len(track_points) == 1 and track_id not in self.counted_ids:
                        if center_point[1] > self.counting_line_y or center_point[1] < self.counting_line_y:
                            vehicle_type = self.vehicle_classes[class_id]
                            self.vehicle_count[vehicle_type] += 1
                            self.total_vehicles += 1
                            self.counted_ids.add(track_id)
                            print(f"Vehicle #{self.total_vehicles} detected (initial): {vehicle_type} (ID: {track_id})")
                    elif self.has_crossed_line(track_points, track_id):
                        vehicle_type = self.vehicle_classes[class_id]
                        self.vehicle_count[vehicle_type] += 1
                        self.total_vehicles += 1
                        print(f"Vehicle #{self.total_vehicles} detected: {vehicle_type} (ID: {track_id})")
                    
                    # Draw bounding box
                    x1 = int(x - w/2)
                    y1 = int(y - h/2)
                    x2 = int(x + w/2)
                    y2 = int(y + h/2)
                    
                    cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
                    
                    # Draw label
                    label = f"{self.vehicle_classes[class_id]} ID:{track_id} {conf:.2f}"
                    cv2.putText(annotated_frame, label, (x1, y1 - 10),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
                    
                    # Draw track trail
                    points = np.array(self.track_history[track_id], dtype=np.int32)
                    if len(points) > 1:
                        cv2.polylines(annotated_frame, [points], False, (0, 255, 255), 2)
        
        return annotated_frame
    
    def add_stats_overlay(self, frame):
        """Add counting statistics overlay to the frame"""
        y_offset = 30
        
        # Total count (changed color to red)
        cv2.putText(frame, f"Total Vehicles: {self.total_vehicles}", 
                   (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)  # (0, 0, 255) is red
        y_offset += 30
        
        # Individual vehicle type counts
        for vehicle_type, count in self.vehicle_count.items():
            text = f"{vehicle_type.capitalize()}: {count}"
            cv2.putText(frame, text, (10, y_offset), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            y_offset += 25
            
        return frame
    
    def process_video(self, video_path, output_path=None, display_video=True):
        """
        Process entire video for vehicle counting
        
        Args:
            video_path (str): Path to input video file
            output_path (str): Path to save output video (optional)
            display_video (bool): Whether to display video in real-time
        """
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Could not open video file: {video_path}")
        
        # Get video properties
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        print(f"Processing video: {width}x{height} @ {fps}fps, {total_frames} frames")
        
        # Setup counting line (middle of frame by default)
        self.setup_counting_line(height)
        
        # Setup video writer if output path is provided
        out = None
        if output_path:
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        frame_count = 0
        start_time = time.time()
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_count += 1
                
                # Process frame for vehicle detection and counting
                processed_frame = self.process_frame(frame)
                
                # Add counting line and statistics
                self.draw_counting_line(processed_frame)
                processed_frame = self.add_stats_overlay(processed_frame)
                
                # Save frame if output video is specified
                if out:
                    out.write(processed_frame)
                
                # Display video if requested
                if display_video:
                    cv2.imshow('Vehicle Counter', processed_frame)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        print("Interrupted by user")
                        break
                
                # Progress update
                if frame_count % (fps * 5) == 0:  # Every 5 seconds
                    elapsed = time.time() - start_time
                    progress = (frame_count / total_frames) * 100
                    print(f"Progress: {progress:.1f}% - {self.total_vehicles} vehicles counted - "
                          f"Processing speed: {frame_count/elapsed:.1f} fps")
        
        except KeyboardInterrupt:
            print("Processing interrupted by user")
        
        finally:
            # Cleanup
            cap.release()
            if out:
                out.release()
            if display_video:
                cv2.destroyAllWindows()
            
            # Print final results
            self.print_final_results()
    
    def print_final_results(self):
        """Print final counting results"""
        print("\n" + "="*50)
        print("FINAL VEHICLE COUNT RESULTS")
        print("="*50)
        print(f"Total Vehicles Counted: {self.total_vehicles}")
        print("-" * 30)
        
        for vehicle_type, count in self.vehicle_count.items():
            percentage = (count / self.total_vehicles * 100) if self.total_vehicles > 0 else 0
            print(f"{vehicle_type.capitalize()}: {count} ({percentage:.1f}%)")
        
        print("="*50)

def main():
    """Main function to run the vehicle counter"""
    parser = argparse.ArgumentParser(description='Count vehicles in video')
    parser.add_argument('video_path', help='Path to input video file')
    parser.add_argument('--output', '-o', help='Path to output video file')
    parser.add_argument('--model', '-m', default='yolov8n.pt', 
                       help='Path to YOLO model weights (default: yolov8n.pt)')
    parser.add_argument('--confidence', '-c', type=float, default=0.3,
                       help='Confidence threshold for detections (default: 0.3)')
    parser.add_argument('--no-display', action='store_true',
                       help='Do not display video during processing')
    
    args = parser.parse_args()
    
    # Create vehicle counter instance
    counter = VehicleCounter(model_path=args.model, 
                           confidence_threshold=args.confidence)
    
    try:
        # Process the video
        counter.process_video(
            video_path=args.video_path,
            output_path=args.output,
            display_video=not args.no_display
        )
    except Exception as e:
        print(f"Error processing video: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    # Example usage for testing without command line arguments
    if len(sys.argv) == 1:
        # You can modify these paths for testing
        video_path = "traffic_video.mp4"  # Replace with your video path
        output_path = "counted_vehicles_output.mp4"  # Optional output path
        
        counter = VehicleCounter()
        
        try:
            counter.process_video(video_path, output_path, display_video=True)
        except FileNotFoundError:
            print("Please provide a valid video file path or use command line arguments:")
            print("python vehicle_counter.py <video_path> [--output output.mp4] [--model yolov8s.pt]")
    else:
        exit(main())