import speech_recognition as sr
import pyttsx3
import webbrowser
import subprocess
import sys
import os
import time
import threading
from datetime import datetime
import requests
import json
import re
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import random

class PuzaVoiceAssistant:
    def __init__(self):
        """Initialize Puza Voice Assistant with advanced web automation"""
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        
        # Initialize text-to-speech engine
        self.tts_engine = pyttsx3.init()
        self.setup_voice()
        
        # Web driver for automation
        self.driver = None
        self.current_website = None
        self.setup_web_driver()
        
        # Application paths
        self.app_paths = {
            'notepad': 'notepad.exe',
            'calculator': 'calc.exe',
            'chrome': 'chrome.exe',
            'firefox': 'firefox.exe',
            'edge': 'msedge.exe',
            'word': 'winword.exe',
            'excel': 'excel.exe',
            'powerpoint': 'powerpnt.exe'
        }
        
        # Website configurations with multiple selector strategies
        self.websites = {
            'youtube': {
                'url': 'https://www.youtube.com',
                'search_selectors': [
                    ('name', 'search_query'),
                    ('xpath', '//input[@id="search"]'),
                    ('css_selector', 'input#search'),
                    ('xpath', '//input[@placeholder="Search"]'),
                    ('css_selector', 'ytd-searchbox input'),
                    ('xpath', '//form[@id="search-form"]//input')
                ],
                'search_button_selectors': [
                    ('id', 'search-icon-legacy'),
                    ('xpath', '//button[@id="search-icon-legacy"]'),
                    ('css_selector', '#search-icon-legacy'),
                    ('xpath', '//button[contains(@class, "search-button")]')
                ]
            },
            'google': {
                'url': 'https://www.google.com',
                'search_selectors': [
                    ('name', 'q'),
                    ('xpath', '//input[@name="q"]'),
                    ('css_selector', 'input[name="q"]'),
                    ('xpath', '//textarea[@name="q"]')
                ]
            },
            'amazon': {
                'url': 'https://www.amazon.com',
                'search_selectors': [
                    ('id', 'twotabsearchtextbox'),
                    ('xpath', '//input[@id="twotabsearchtextbox"]'),
                    ('css_selector', '#twotabsearchtextbox'),
                    ('xpath', '//input[@placeholder="Search Amazon"]')
                ]
            },
            'facebook': {'url': 'https://www.facebook.com'},
            'twitter': {'url': 'https://www.twitter.com'},
            'instagram': {'url': 'https://www.instagram.com'},
            'linkedin': {'url': 'https://www.linkedin.com'},
            'github': {'url': 'https://www.github.com'},
            'stackoverflow': {'url': 'https://www.stackoverflow.com'},
            'netflix': {'url': 'https://www.netflix.com'},
            'spotify': {'url': 'https://www.spotify.com'},
            'gmail': {'url': 'https://mail.google.com'},
            'whatsapp': {'url': 'https://web.whatsapp.com'}
        }
        
        self.running_apps = []
        
        print("🌟 Puza Voice Assistant initialized with advanced intelligence!")
        self.speak("Hello my dear! I'm Puza, your super intelligent voice assistant. I can navigate any website, search with precision, and handle complex tasks for you!")

    def setup_voice(self):
        """Configure the voice to be female and sweet"""
        voices = self.tts_engine.getProperty('voices')
        
        for voice in voices:
            if any(keyword in voice.name.lower() for keyword in ['female', 'zira', 'hazel', 'susan', 'kate']):
                self.tts_engine.setProperty('voice', voice.id)
                break
        
        self.tts_engine.setProperty('rate', 185)
        self.tts_engine.setProperty('volume', 0.95)

    def setup_web_driver(self):
        """Setup Chrome WebDriver with advanced options"""
        try:
            chrome_options = Options()
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-blink-features=AutomationControlled")
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)
            chrome_options.add_argument("--window-size=1920,1080")
            
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            print("✅ Advanced web automation ready!")
        except Exception as e:
            print(f"⚠️ Web driver setup failed: {e}")
            self.driver = None

    def speak(self, text):
        """Convert text to speech with sweet female voice"""
        print(f"🎵 Puza: {text}")
        self.tts_engine.say(text)
        self.tts_engine.runAndWait()

    def listen(self):
        """Listen for voice commands with improved recognition"""
        try:
            with self.microphone as source:
                print("🎤 Listening for your command...")
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                audio = self.recognizer.listen(source, timeout=8, phrase_time_limit=12)
            
            command = self.recognizer.recognize_google(audio).lower()
            print(f"📝 You said: {command}")
            return command
            
        except sr.WaitTimeoutError:
            return "timeout"
        except sr.UnknownValueError:
            self.speak("I didn't quite catch that, sweetheart. Could you repeat it for me?")
            return "unknown"
        except sr.RequestError:
            self.speak("I'm having trouble with speech recognition right now, darling.")
            return "error"

    def find_element_with_multiple_selectors(self, selectors, wait_time=10):
        """Try multiple selectors to find an element"""
        wait = WebDriverWait(self.driver, wait_time)
        
        for selector_type, selector_value in selectors:
            try:
                if selector_type == 'id':
                    element = wait.until(EC.element_to_be_clickable((By.ID, selector_value)))
                elif selector_type == 'name':
                    element = wait.until(EC.element_to_be_clickable((By.NAME, selector_value)))
                elif selector_type == 'xpath':
                    element = wait.until(EC.element_to_be_clickable((By.XPATH, selector_value)))
                elif selector_type == 'css_selector':
                    element = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, selector_value)))
                
                return element
            except TimeoutException:
                continue
            except Exception as e:
                continue
        
        return None

    def navigate_to_website(self, website_name):
        """Navigate to a specific website intelligently"""
        if not self.driver:
            self.fallback_browser_open(website_name)
            return False

        try:
            website_name = website_name.lower().strip()
            
            if website_name in self.websites:
                url = self.websites[website_name]['url']
                self.speak(f"Taking you to {website_name} right now, honey!")
                self.driver.get(url)
                self.current_website = website_name
                
                # Wait for page to load
                time.sleep(3)
                
                # Handle cookie popups or initial overlays
                self.handle_popups()
                
                return True
            else:
                # Try to construct URL
                url = f"https://www.{website_name}.com"
                self.speak(f"Navigating to {website_name} for you!")
                self.driver.get(url)
                self.current_website = website_name
                time.sleep(3)
                return True
                
        except Exception as e:
            print(f"Navigation error: {e}")
            self.speak(f"I had trouble with {website_name}. Let me try a different approach.")
            self.fallback_browser_open(website_name)
            return False

    def handle_popups(self):
        """Handle common popups and overlays"""
        try:
            # Common popup close selectors
            popup_selectors = [
                ('xpath', '//button[contains(text(), "Accept")]'),
                ('xpath', '//button[contains(text(), "OK")]'),
                ('xpath', '//button[contains(text(), "Close")]'),
                ('xpath', '//button[contains(@class, "close")]'),
                ('css_selector', '.popup-close'),
                ('css_selector', '.modal-close'),
                ('xpath', '//div[@role="dialog"]//button')
            ]
            
            for selector_type, selector_value in popup_selectors:
                try:
                    if selector_type == 'xpath':
                        element = self.driver.find_element(By.XPATH, selector_value)
                    else:
                        element = self.driver.find_element(By.CSS_SELECTOR, selector_value)
                    
                    if element.is_displayed():
                        element.click()
                        time.sleep(1)
                        break
                except:
                    continue
                    
        except Exception:
            pass

    def search_on_website(self, website_name, query):
        """Intelligently search on any website"""
        if not self.driver:
            self.fallback_search(website_name, query)
            return

        try:
            # First navigate to the website if not already there
            if self.current_website != website_name:
                if not self.navigate_to_website(website_name):
                    return

            self.speak(f"Searching {website_name} for {query}!")
            
            # Wait a bit for the page to fully load
            time.sleep(2)
            
            # Get website configuration
            website_config = self.websites.get(website_name, {})
            search_selectors = website_config.get('search_selectors', [])
            
            # Find search box with multiple strategies
            search_box = self.find_element_with_multiple_selectors(search_selectors, wait_time=15)
            
            if search_box:
                # Clear and enter search query
                search_box.clear()
                time.sleep(0.5)
                search_box.send_keys(query)
                time.sleep(1)
                
                # Try to click search button first (for YouTube)
                if website_name == 'youtube':
                    search_button_selectors = website_config.get('search_button_selectors', [])
                    search_button = self.find_element_with_multiple_selectors(search_button_selectors, wait_time=5)
                    
                    if search_button:
                        search_button.click()
                        self.speak(f"Perfect! Here are your {website_name} results for {query}!")
                    else:
                        # Fallback to Enter key
                        search_box.send_keys(Keys.RETURN)
                        self.speak(f"Found your {website_name} search results for {query}!")
                else:
                    # For other sites, use Enter key
                    search_box.send_keys(Keys.RETURN)
                    self.speak(f"Here are your {website_name} results for {query}!")
                
                time.sleep(2)
            else:
                self.speak(f"I'm having trouble finding the search box on {website_name}. Let me try a direct search URL.")
                self.fallback_search(website_name, query)
                
        except Exception as e:
            print(f"Search error on {website_name}: {e}")
            self.speak(f"I encountered an issue searching {website_name}. Let me try an alternative method.")
            self.fallback_search(website_name, query)

    def fallback_search(self, website_name, query):
        """Fallback search method using direct URLs"""
        search_urls = {
            'youtube': f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}",
            'google': f"https://www.google.com/search?q={query.replace(' ', '+')}",
            'amazon': f"https://www.amazon.com/s?k={query.replace(' ', '+')}",
        }
        
        if website_name in search_urls:
            if self.driver:
                self.driver.get(search_urls[website_name])
            else:
                webbrowser.open(search_urls[website_name])
            self.speak(f"Here are your {website_name} results for {query}!")
        else:
            google_search = f"https://www.google.com/search?q=site:{website_name}.com {query.replace(' ', '+')}"
            if self.driver:
                self.driver.get(google_search)
            else:
                webbrowser.open(google_search)
            self.speak(f"I've searched for {query} on {website_name} using Google!")

    def fallback_browser_open(self, website_name):
        """Fallback to default browser"""
        if website_name in self.websites:
            webbrowser.open(self.websites[website_name]['url'])
        else:
            webbrowser.open(f"https://www.{website_name}.com")
        self.speak(f"I've opened {website_name} in your default browser!")

    def open_application(self, app_name):
        """Open specified application"""
        try:
            app_name = app_name.lower()
            
            if app_name in self.app_paths:
                subprocess.Popen(self.app_paths[app_name])
                self.running_apps.append(app_name)
                self.speak(f"Opening {app_name} for you right away, darling!")
            else:
                self.speak(f"Let me find and open {app_name} for you, sweetie.")
                try:
                    subprocess.Popen(app_name)
                except:
                    self.speak(f"I couldn't locate {app_name}. Please check if it's installed correctly.")
                    
        except Exception as e:
            self.speak(f"I had trouble opening {app_name}, honey.")

    def close_application(self, app_name):
        """Close specified application"""
        try:
            app_name = app_name.lower()
            
            if sys.platform == "win32":
                subprocess.run(f'taskkill /f /im {app_name}.exe', shell=True, capture_output=True)
                self.speak(f"I've closed {app_name} for you, sweetheart!")
            else:
                subprocess.run(f'pkill -f {app_name}', shell=True)
                self.speak(f"I've closed {app_name} for you, darling!")
                
        except Exception as e:
            self.speak(f"I had trouble closing {app_name}. It might already be closed.")

    def get_time(self):
        """Get current time"""
        current_time = datetime.now().strftime("%I:%M %p")
        self.speak(f"The current time is {current_time}, my dear!")

    def get_date(self):
        """Get current date"""
        current_date = datetime.now().strftime("%B %d, %Y")
        self.speak(f"Today is {current_date}, sweetheart!")

    def close_browser(self):
        """Close the automated browser"""
        if self.driver:
            self.driver.quit()
            self.driver = None
            self.current_website = None
            self.speak("I've closed the browser for you, honey!")

    def process_command(self, command):
        """Process and execute voice commands with enhanced intelligence"""
        if command in ["timeout", "unknown", "error"]:
            return True
        
        command = command.lower().strip()
        
        # Enhanced website navigation with search combinations
        if "go to" in command and ("search for" in command or "and search" in command):
            # Handle: "go to youtube and search for cats" or "go to youtube search for cats"
            if "and search for" in command:
                parts = command.split("and search for")
            elif "search for" in command:
                parts = command.split("search for")
            else:
                parts = command.split("and search")
            
            if len(parts) == 2:
                website_part = parts[0].replace("go to", "").strip()
                search_query = parts[1].strip()
                
                self.search_on_website(website_part, search_query)
        
        # Direct website searches
        elif any(phrase in command for phrase in ["search youtube for", "youtube search for"]):
            if "search youtube for" in command:
                query = command.split("search youtube for", 1)[1].strip()
            else:
                query = command.split("youtube search for", 1)[1].strip()
            self.search_on_website("youtube", query)
        
        elif any(phrase in command for phrase in ["search google for", "google search for"]):
            if "search google for" in command:
                query = command.split("search google for", 1)[1].strip()
            else:
                query = command.split("google search for", 1)[1].strip()
            self.search_on_website("google", query)
        
        elif any(phrase in command for phrase in ["search amazon for", "amazon search for"]):
            if "search amazon for" in command:
                query = command.split("search amazon for", 1)[1].strip()
            else:
                query = command.split("amazon search for", 1)[1].strip()
            self.search_on_website("amazon", query)
        
        # Simple website navigation
        elif "go to" in command:
            website = command.replace("go to", "").strip()
            self.navigate_to_website(website)
        
        # General search (defaults to Google)
        elif "search" in command or "look up" in command:
            if "search for" in command:
                query = command.split("search for", 1)[1].strip()
            elif "look up" in command:
                query = command.split("look up", 1)[1].strip()
            else:
                query = command.replace("search", "").strip()
            
            if query:
                self.search_on_website("google", query)
            else:
                self.speak("What would you like me to search for, honey?")
        
        # Application commands
        elif "open" in command:
            app_name = command.replace("open", "").strip()
            if app_name:
                self.open_application(app_name)
            else:
                self.speak("Which application would you like me to open, darling?")
        
        elif "close" in command:
            if "browser" in command:
                self.close_browser()
            else:
                app_name = command.replace("close", "").strip()
                if app_name:
                    self.close_application(app_name)
                else:
                    self.speak("What would you like me to close, sweetie?")
        
        # Time and date
        elif "time" in command:
            self.get_time()
        elif "date" in command:
            self.get_date()
        
        # Exit commands
        elif any(word in command for word in ["exit", "quit", "bye", "goodbye", "stop"]):
            self.speak("Goodbye my dear! It's been absolutely wonderful helping you today. Take care!")
            if self.driver:
                self.driver.quit()
            return False
        
        # Help command
        elif "help" in command:
            help_text = """I'm your super intelligent assistant! Here's what I can do:
            - Smart website navigation: 'go to youtube and search for cooking videos'
            - Direct searches: 'search youtube for music' or 'search amazon for laptops'
            - Website visits: 'go to netflix' or 'go to facebook'
            - Google anything: 'search for weather today'
            - Open apps: 'open calculator' or 'open notepad'
            - Close apps: 'close chrome' or 'close browser'
            - Time & date: 'what time is it' or 'what's today's date'
            - Exit: 'goodbye' or 'stop'
            
            I can handle complex combinations and I'm always learning to serve you better!"""
            self.speak(help_text)
        
        # Greetings with more variety
        elif any(word in command for word in ["hello", "hi", "hey"]):
            greetings = [
                "Hello there, beautiful! What can I do to make your day amazing?",
                "Hi sweetheart! I'm so excited to help you with anything you need!",
                "Hey there, darling! Ready for some intelligent assistance?",
                "Hello my dear! Your wish is my command today!",
                "Hi honey! Let's accomplish something wonderful together!"
            ]
            self.speak(random.choice(greetings))
        
        else:
            responses = [
                "I'm not quite sure what you'd like me to do, sweetheart. Could you try rephrasing that?",
                "I didn't understand that command, honey. Say 'help' to see what I can do for you!",
                "That's a new one for me, darling! Can you explain what you'd like me to do?"
            ]
            self.speak(random.choice(responses))
        
        return True

    def run(self):
        """Main loop with enhanced intelligence"""
        welcome_messages = [
            "I'm ready to be your intelligent companion! Try saying 'go to youtube and search for funny videos' or 'help' to see my full capabilities!",
            "Your super smart assistant is ready! I can navigate any website and search with precision. What shall we do first?",
            "Hello darling! I'm equipped with advanced intelligence to help you browse, search, and manage applications. How may I assist you today?"
        ]
        self.speak(random.choice(welcome_messages))
        
        while True:
            try:
                command = self.listen()
                
                if command and command not in ["timeout", "unknown", "error"]:
                    if "puza" in command:
                        command = command.replace("puza", "").strip()
                    
                    if not self.process_command(command):
                        break
                
                time.sleep(0.5)
                
            except KeyboardInterrupt:
                self.speak("Goodbye my dear! It's been wonderful helping you today!")
                if self.driver:
                    self.driver.quit()
                break
            except Exception as e:
                print(f"Error: {e}")
                self.speak("I encountered a small hiccup, but I'm still here for you, sweetheart!")
                continue

def main():
    """Main function to start Puza Voice Assistant"""
    try:
        assistant = PuzaVoiceAssistant()
        assistant.run()
    except Exception as e:
        print(f"Error starting Puza: {e}")
        print("\nPlease install required packages:")
        print("pip install speechrecognition pyttsx3 pyaudio selenium")
        print("\nAlso install ChromeDriver from: https://chromedriver.chromium.org/")
        print("Make sure ChromeDriver is in your system PATH")

if __name__ == "__main__":
    main()