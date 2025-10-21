import cv2
import mediapipe as mp
import numpy as np
import time

class FingerCounter:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils
        
        # Finger tip and PIP landmark IDs
        self.tip_ids = [4, 8, 12, 16, 20]  # Thumb, Index, Middle, Ring, Pinky
        self.pip_ids = [3, 6, 10, 14, 18]  # PIP joints for each finger
        
        # Addition logic variables
        self.sequence = []
        self.last_count = 0
        self.last_detection_time = 0
        self.stable_count_duration = 1.5  # seconds to confirm a number
        self.current_stable_count = 0
        self.stable_start_time = 0
        self.total_sum = 0
        self.operation_complete = False

    def count_fingers(self, landmarks):
        """Count the number of raised fingers"""
        fingers = []
        
        # Thumb (compare x coordinates for left/right hand detection)
        if landmarks[self.tip_ids[0]].x > landmarks[self.tip_ids[0] - 1].x:
            fingers.append(1)
        else:
            fingers.append(0)
            
        # Other four fingers (compare y coordinates)
        for i in range(1, 5):
            if landmarks[self.tip_ids[i]].y < landmarks[self.pip_ids[i]].y:
                fingers.append(1)
            else:
                fingers.append(0)
                
        return sum(fingers)

    def process_frame(self, frame):
        """Process each frame for finger detection and addition logic"""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        
        current_time = time.time()
        finger_count = 0
        
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                # Draw hand landmarks
                self.mp_drawing.draw_landmarks(
                    frame, hand_landmarks, self.mp_hands.HAND_CONNECTIONS
                )
                
                # Count fingers
                finger_count = self.count_fingers(hand_landmarks.landmark)
        
        # Addition logic
        self.handle_addition_sequence(finger_count, current_time)
        
        # Display information on frame
        self.draw_interface(frame, finger_count)
        
        return frame

    def handle_addition_sequence(self, finger_count, current_time):
        """Handle the sequence of finger counts for addition"""
        if finger_count > 0:
            # Check if the count is stable
            if finger_count == self.current_stable_count:
                if current_time - self.stable_start_time >= self.stable_count_duration:
                    # Count is stable, add to sequence if it's new
                    if len(self.sequence) == 0 or finger_count != self.sequence[-1]:
                        self.sequence.append(finger_count)
                        print(f"Added {finger_count} to sequence: {self.sequence}")
                        
                        # Calculate sum if we have at least 2 numbers
                        if len(self.sequence) >= 2:
                            self.total_sum = sum(self.sequence)
                            print(f"Current sum: {self.total_sum}")
                        
                        # Reset for next number
                        self.current_stable_count = 0
                        self.stable_start_time = current_time
            else:
                # New count detected, start stability timer
                self.current_stable_count = finger_count
                self.stable_start_time = current_time
        else:
            # No fingers detected, reset stability tracking
            self.current_stable_count = 0

    def draw_interface(self, frame, finger_count):
        """Draw the user interface on the frame"""
        height, width = frame.shape[:2]
        
        # Background for text
        overlay = frame.copy()
        cv2.rectangle(overlay, (10, 10), (width-10, 150), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
        
        # Current finger count
        cv2.putText(frame, f"Fingers: {finger_count}", (20, 40), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        # Sequence display
        sequence_text = " + ".join(map(str, self.sequence)) if self.sequence else "Waiting for first number..."
        cv2.putText(frame, f"Sequence: {sequence_text}", (20, 70), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        # Sum display
        if len(self.sequence) >= 2:
            cv2.putText(frame, f"Sum: {self.total_sum}", (20, 100), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
        
        # Instructions
        cv2.putText(frame, "Hold fingers steady for 1.5s to register", (20, 130), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
        
        # Control instructions
        cv2.putText(frame, "Press 'r' to reset, 'q' to quit", (20, height-20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

    def reset_sequence(self):
        """Reset the addition sequence"""
        self.sequence = []
        self.total_sum = 0
        self.current_stable_count = 0
        self.stable_start_time = 0
        print("Sequence reset!")

def main():
    # Initialize camera
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    if not cap.isOpened():
        print("Error: Could not open camera")
        return
    
    counter = FingerCounter()
    print("Finger Addition Calculator Started!")
    print("Instructions:")
    print("1. Show your fingers clearly to the camera")
    print("2. Hold each number steady for 2.0 seconds")
    print("3. Make sure your hand is well-lit and fingers are clearly separated")
    print("4. The system will automatically add the numbers")
    print("5. Press 'r' to reset, 'q' to quit")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame")
            break
        
        # Flip frame horizontally for mirror effect
        frame = cv2.flip(frame, 1)
        
        # Process the frame
        frame = counter.process_frame(frame)
        
        # Display the frame
        cv2.imshow('Finger Addition Calculator', frame)
        
        # Handle keyboard input
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('r'):
            counter.reset_sequence()
    
    # Cleanup
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()