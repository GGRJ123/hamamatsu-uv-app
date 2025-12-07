import time
from PyExpLabSys.drivers.hamamatsu import LCL1V5
import serial
from serial.tools import list_ports
import os
import threading

def time_string_to_seconds(time_str: str) -> int:
    """Convert a time string in the format 'HH:MM:SS' to total seconds."""
    hours, minutes, seconds = map(int, time_str.split(':'))
    total_seconds = hours * 3600 + minutes * 60 + seconds
    return total_seconds


class Controller:

    lc_l1v5 = None
    is_connected = False
    is_running = False
    should_stop = False

    def __init__(self):

        try:
            # connects to the conntroller through the port
            self.lc_l1v5 = LCL1V5(port='COM8')
            #sets the controller, so only the program can switch it on and off
            self.is_connected = True
            print("Connected to Hamamatsu LC-L1V5 LED Driver")

            self.lc_l1v5.select_command_communication()        
        except serial.SerialException as e:
            self.is_connected = False
            self.lc_l1v5 = None # Ensure the object is not created if it fails
            # We print a warning but allow the server to keep running.
            print(f"⚠️ WARNING: Hardware connection failed! Device on COM8 not found. Full Error: {e}")
            print("         --> Application is running in SAFE MODE.")
        except Exception as e:
            self.is_connected = False
            print(f"⚠️ WARNING: An unexpected error occurred while connecting to hardware: {e}")

    def start_procedure(self, request_data):
        procedure_thread = threading.Thread(
            target=self.run_procedure, 
            args=(request_data,)
        )
        procedure_thread.start()
        print("Procedure thread started.")
    
    def stop_procedure_signal(self):
        if self.is_running:
            self.should_stop = True
            print("Controller: Recieved stop signal.")
            return True
        return False
    
    def _run_procedure_in_background(self, request_data):
        """
        Executes the step-by-step UV procedure. Runs in a separate thread.
        """
        self.is_running = True
        self.should_stop = False
        
        if not self.is_connected:
            print("Controller: SAFE MODE. Cannot execute procedure (no hardware).")
            self.is_running = False
            return

        uv_selected = request_data.selected_channels

        print("--- UV PROCEDURE STARTED ---")
        
        # 1. Turn on all selected channels (using your existing method)
        self.func_uv_on(uv_selected) 
        time.sleep(1) # Give the device a moment to stabilize

        # 2. Loop through each step
        for index, step in enumerate(request_data.steps):
            
            # 🌟 Check for stop signal at the start of every step 🌟
            if self.should_stop:
                break 

            total_seconds = time_string_to_seconds(step.time)
            
            # Skip steps with zero time and zero intensity
            if total_seconds == 0 and step.intensity == 0:
                continue

            print(f"Executing Step {index + 1}: Intensity={step.intensity}, Time={total_seconds}s")
            
            # Set the intensity level (using your existing method)
            self.func_set_uv_intensity(step.intensity)
            
            # Wait for the step duration, checking the stop flag every second
            for _ in range(total_seconds):
                if self.should_stop:
                    break 
                time.sleep(1) # Wait for 1 second at a time
            
            if self.should_stop:
                break # Break out of the step loop if the sleep was interrupted

        # 3. Cleanup: Always turn everything off and reset flags!
        self.func_uv_off() # Use your existing method
        self.is_running = False 
        self.should_stop = False 
        print("--- UV PROCEDURE FINISHED/HALTED ---")


    def func_set_uv_intensity(self, value):
        if value < 0:
            value = "000"
        elif value < 10:
            value = "00" + str(value)
        elif value < 100:
            value = "0" + str(value)
        else:
            value = "100"

        self.lc_l1v5.set_step_settings(0,(value,'001','001'),('01','01','01'))

    #WARNING!!!!! Turns on all channel and turns on the uv
    def func_uv_on(self, uv_selected):
        time.sleep(0.5)
        for i in uv_selected:
            self.lc_l1v5.switch_led_on(i)
            time.sleep(0.1)
  

    #turns all channel and uv

    def func_uv_off(self): 
        self.lc_l1v5.switch_led_off(0)

    #Allows user to interact with the controller physically
    def func_manual_control_enable(self):
        self.lc_l1v5.comm("CNT0")
    
    def func_program_control_enable(self):
        self.lc_l1v5.select_command_communication()