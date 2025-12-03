import time
from PyExpLabSys.drivers.hamamatsu import LCL1V5
import serial


class Controller:

    lc_l1v5 = None
    is_connected = False

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

        # 🌟 NEW: A method to check the connection before sending commands
    def check_connection(self):
        if not self.is_connected:
            print("🚫 Controller: Command blocked. No device connected.")
            return False
        return True

    def func_set_uv_intensity(self, value):
        if not self.check_connection():
            return
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
        if not self.check_connection():
            return
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