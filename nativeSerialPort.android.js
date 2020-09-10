const app = require("application");
var utils = require("tns-core-modules/utils/utils");
//const { Duplex } = require("stream");
//const util = require("util");
const context = android.content.Context;
const UsbSerialDevice = com.felhr.usbserial.UsbSerialDevice;
const UsbSerialInterface = com.felhr.usbserial.UsbSerialInterface;
var ACTION_USB_PERMISSION = "com.android.example.USB_PERMISSION";

const DATABITS = Object.freeze([5, 6, 7, 8]);
const DATABITSCONVERSION = Object.freeze({
  5: UsbSerialInterface.DATA_BITS_5,
  6: UsbSerialInterface.DATA_BITS_6,
  7: UsbSerialInterface.DATA_BITS_7,
  8: UsbSerialInterface.DATA_BITS_8,
});
const STOPBITS = Object.freeze([1, 1.5, 2]);
const STOPBITSCONVERSION = Object.freeze({
  1: UsbSerialInterface.STOP_BITS_1,
  1.5: UsbSerialInterface.STOP_BITS_15,
  2: UsbSerialInterface.STOP_BITS_2,
});
const PARITY = Object.freeze(["none", "even", "mark", "odd", "space"]);
const PARITYCONVERSION = Object.freeze({
  none: UsbSerialInterface.PARITY_NONE,
  even: UsbSerialInterface.PARITY_EVEN,
  mark: UsbSerialInterface.PARITY_MARK,
  odd: UsbSerialInterface.PARITY_ODD,
  space: UsbSerialInterface.PARITY_SPACE,
});
const FLOWCONTROLS = Object.freeze(["xon", "xoff", "xany", "rtscts"]);
// const FLOWCONTROLSCONVERSION = Object.freeze({
//   xon: UsbSerialInterface.PARITY_NONE,
//   xoff: UsbSerialInterface.FLOW_CONTROL_OFF,
//   xany: UsbSerialInterface.PARITY_NONE,
//   rtscts: UsbSerialInterface.FLOW_CONTROL_DSR_DTR,
// })

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

const defaultSettings = Object.freeze({
  autoOpen: true,
  endOnClose: false,
  baudRate: 9600,
  dataBits: 8,
  hupcl: true,
  lock: true,
  parity: "none",
  rtscts: false,
  stopBits: 1,
  xany: false,
  xoff: false,
  xon: false,
  highWaterMark: 64 * 1024,
});

class SerialPort {
  constructor(device2, options, openCallback) {
    if (!(this instanceof SerialPort)) {
      return new SerialPort(device2, options, openCallback);
    }
    this.isOpen = false;
    this.connection = null;
    this.port = null;
    this._onReceiver = {};
    this._readCallback = new UsbSerialInterface.UsbReadCallback({
      onReceivedData: (data) => {
        console.log(data);
      },
    });

    var device = null;
    const manager = app.android.context.getSystemService(context.USB_SERVICE);
    const permissionIntent = android.app.PendingIntent.getBroadcast(
      utils.ad.getApplicationContext(),
      0,
      new android.content.Intent(ACTION_USB_PERMISSION),
      0
    );
    const usbDevices = manager.getDeviceList().values().iterator();
    if (usbDevices.hasNext()) {
      device = usbDevices.next();
    }
    if (!device) {
      throw new TypeError(`"device" is not defined: ${device}`);
    }

    if (!manager.hasPermission(device)) {
      manager.requestPermission(device, permissionIntent);
      console.log("Requesting Permission...");
    }
    const connection = manager.openDevice(device);
    if (connection === null) throw new Error("Unable to Connect!");
    this.port = UsbSerialDevice.createUsbSerialDevice(device, connection);
    // if (options.autoOpen) {
    //   this.open(openCallback);
    // }
  }

  on(event, func) {
    this._onReceiver[event] = func;
    switch (event) {
      case "data":
        const newFunc = (data) => {
          const response = fromUTF8Array(data).replace(/\n|\r/g, "");
          func(response);
        };
        const dataCallback = new UsbSerialInterface.UsbReadCallback({
          onReceivedData: newFunc,
        });
        this.port.read(dataCallback);
        break;
    }
  }

  async open(openCallback) {
    if (this.isOpen) throw Error("Port already open!");
    console.log("Opening Port...");
    this.port.open();
    console.log("port Open!");
    this.port.setBaudRate(115200);
    this.port.setDataBits(UsbSerialInterface.DATA_BITS_8);
    this.port.setStopBits(UsbSerialInterface.STOP_BITS_1);
    this.port.setParity(UsbSerialInterface.PARITY_NONE);
    this.port.read(this._readCallback);
    // this.port.setFlowControl(UsbSerialInterface.FLOW_CONTROL_RTS_CTS);
    this.isOpen = true;
    openCallback();
  }

  write(data, encoding, writeCallback) {
    if (!this.isOpen) throw Error("Port not open!");
    this.port.write(StringToBytes(data));
    writeCallback();
    //console.log('NOT CONNECTED!');
  }
  drain(drainCallback) {
    drainCallback();
  }
  flush(flushCallback) {
    flushCallback();
  }
  close(closeCallback) {
    this.port.close();
    closeCallback();
  }

  static list() {
    const manager = app.android.context.getSystemService(context.USB_SERVICE);
    var devices = [];
    const usbDevices = manager.getDeviceList().values().iterator();
    while (usbDevices.hasNext()) {
      const newDevice = usbDevices.next();
      devices.push(newDevice);
    }
    return devices;
  }
}

export default SerialPort;
