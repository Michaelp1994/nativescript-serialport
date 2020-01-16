const app = require("application");
var utils = require("tns-core-modules/utils/utils");

const context = android.content.Context;
const UsbSerialDevice = com.felhr.usbserial.UsbSerialDevice;
const UsbSerialInterface = com.felhr.usbserial.UsbSerialInterface;
var ACTION_USB_PERMISSION = "com.android.example.USB_PERMISSION";

function StringToBytes(str) {
  var result = [];
  for (var i = 0; i < str.length; i++) {
    // var charCode = str.charCodeAt(i);
    result.push(str.charCodeAt(i));
  }
  return result;
}

function fromUTF8Array(data) {
  return String.fromCharCode.apply(String, data);
}

export default class UsbSerialPort {
  constructor() {
    this.manager = app.android.context.getSystemService(context.USB_SERVICE);
    this.context = utils.ad.getApplicationContext();
    this.device = null;
    this.connection = null;
    this.port = null;
    this.readDataCallback = new UsbSerialInterface.UsbReadCallback({
      onReceivedData: function(data) {
        try {
          if (data.length > 0) {
            const response = fromUTF8Array(data);
            console.log("data is ", data);
            console.log("response is ", response);
          }
        } catch (err) {
          console.log("Error: ", err);
        }
      }
    });

    this.permissionIntent = android.app.PendingIntent.getBroadcast(
      this.context,
      0,
      new android.content.Intent(ACTION_USB_PERMISSION),
      0
    );
  }

  on(event, func) {
    this._onReceiver[event] = func;
  }

  connect() {
    console.log("Connecting to USB!");
    const usbDevices = this.manager
      .getDeviceList()
      .values()
      .iterator();
    while (usbDevices.hasNext()) {
      this.device = usbDevices.next();
      if (this.manager.hasPermission(this.device)) {
        console.log("Has permission!");
        this.connection = this.manager.openDevice(this.device);
      } else {
        console.log("Doesn't have permission");
        this.manager.requestPermission(this.device, this.permissionIntent);
      }

      if (this.connection == null) {
        console.log("connection is null!");
        return;
      } else {
        console.log("connection", this.connection);
      }
      this.port = UsbSerialDevice.createUsbSerialDevice(
        this.device,
        this.connection
      );
      console.log("port", this.port);
      if (this.port.open()) {
        console.log("port Open!");
        this.port.setBaudRate(115200);
        this.port.setDataBits(UsbSerialInterface.DATA_BITS_8);
        this.port.setStopBits(UsbSerialInterface.STOP_BITS_1);
        this.port.setParity(UsbSerialInterface.PARITY_NONE);
        this.port.setFlowControl(UsbSerialInterface.FLOW_CONTROL_RTS_CTS);
        this.port.read(this.readDataCallback);
      } else {
        console.log("cannot connect!");
      }
      console.log("Finished!");
    }
  }

  write(data) {
    if (this.port) {
      console.log("sending data: ", data);
      data += "\n";
      this.port.write(StringToBytes(data));
    } else {
      console.log("NOT CONNECTED!");
    }
  }
}
