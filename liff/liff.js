
//UUID正しいの書き込み済み


// User service UUID: Change this to your generated service UUID
const USER_SERVICE_UUID           = 'd6d88913-6e55-4e8d-87f4-af235868b377'; // CMD
const CMD_CHARACTERISTIC_UUID     = 'e98498a0-e624-4150-9c19-8ae5b6e7b044';
const MATRIX_CHARACTERISTIC_UUID  = '2fe4e8a1-af17-4faa-b587-7d639a79b9c1';

// PSDI Service UUID: Fixed value for Developer Trial
const PSDI_SERVICE_UUID         = 'e625601e-9e55-4597-a598-76018a0d293d'; // Device ID
const PSDI_CHARACTERISTIC_UUID  = '26e2b12b-85f0-4f3f-9fdd-91d114270e6e';



// Matrix data
let g_rawcode = [];




// -------------- //
// On window load //
// -------------- //

window.onload = () => {
    initializeApp();


    var data = [1,2,3,4,5,6,7];

    var index = (data[0] << 8) + data[1];
    var length_index = (data[2] << 8) + data[3];
    var ir_freq = data[4];
    var ir_format = data[5];
    var rawcode_length = (data[6] << 8) + data[7];
    var code0 = (data[8] << 24) + (data[9] << 16) + (data[10] << 8) + data[11];
    var code1 = (data[12] << 24) + (data[13] << 16) + (data[14] << 8) + data[15];

    uiDebug1Message(index);
    uiDebug2Message(length_index);


    document.getElementById("rawcode_length").innerText = "512";
};

// ----------------- //
// Handler functions //
// ----------------- //

function handlerLoadMatrix() {
    //fuiToggleLedButton(ledState);
    //liffToggleDeviceLedState(ledState);
    liffWriteLoadMatrix();
}

// ------------ //
// UI functions //
// ------------ //

function uiDebugMessage(message){
  var debug_text = document.getElementById('debug');
  debug_text.innerHTML = message;
}

function uiDebug1Message(message){
  var debug_text = document.getElementById('debug1');
  debug_text.innerHTML = message;
}

function uiDebug2Message(message){
  var debug_text = document.getElementById('debug2');
  debug_text.innerHTML = message;
}


function uiToggleDeviceConnected(connected) {
    const elStatus = document.getElementById("status");
    const elControls = document.getElementById("controls");

    elStatus.classList.remove("error");

    if (connected) {
        // Hide loading animation
        uiToggleLoadingAnimation(false);
        // Show status connected
        elStatus.classList.remove("inactive");
        elStatus.classList.add("success");
        elStatus.innerText = "Device connected";
        // Show controls
        elControls.classList.remove("hidden");
    } else {
        // Show loading animation
        uiToggleLoadingAnimation(true);
        // Show status disconnected
        elStatus.classList.remove("success");
        elStatus.classList.add("inactive");
        elStatus.innerText = "Device disconnected";
        // Hide controls
        elControls.classList.add("hidden");
    }
}

function uiToggleLoadingAnimation(isLoading) {
    const elLoading = document.getElementById("loading-animation");

    if (isLoading) {
        // Show loading animation
        elLoading.classList.remove("hidden");
    } else {
        // Hide loading animation
        elLoading.classList.add("hidden");
    }
}

function uiStatusError(message, showLoadingAnimation) {
    uiToggleLoadingAnimation(showLoadingAnimation);

    const elStatus = document.getElementById("status");
    const elControls = document.getElementById("controls");

    // Show status error
    elStatus.classList.remove("success");
    elStatus.classList.remove("inactive");
    elStatus.classList.add("error");
    elStatus.innerText = message;

    // Hide controls
    elControls.classList.add("hidden");
}

function makeErrorMsg(errorObj) {
    return "Error\n" + errorObj.code + "\n" + errorObj.message;
}

// -------------- //
// LIFF functions //
// -------------- //

function initializeApp() {
    liff.init(() => initializeLiff(), error => uiStatusError(makeErrorMsg(error), false));
}


function initializeLiff() {
    liff.initPlugins(['bluetooth']).then(() => {
        liffCheckAvailablityAndDo(() => liffRequestDevice());
    }).catch(error => {
        uiDebugMessage("initializeLiff");
        uiStatusError(makeErrorMsg(error), false);
    });
}

function liffCheckAvailablityAndDo(callbackIfAvailable) {
    // Check Bluetooth availability
    liff.bluetooth.getAvailability().then(isAvailable => {
        if (isAvailable) {
            uiToggleDeviceConnected(false);
            callbackIfAvailable();
        } else {
            uiDebugMessage("liffCheckAvailablityAndDo - else");
            uiStatusError("Bluetooth not available", true);
            setTimeout(() => liffCheckAvailablityAndDo(callbackIfAvailable), 10000);
        }
    }).catch(error => {
        uiDebugMessage("liffCheckAvailablityAndDo - error");
        uiStatusError(makeErrorMsg(error), false);
    });;
}

function liffRequestDevice() {
    liff.bluetooth.requestDevice().then(device => {
        liffConnectToDevice(device);
    }).catch(error => {
        uiDebugMessage("liffRequestDevice");
        uiStatusError(makeErrorMsg(error), false);
    });
}

function liffConnectToDevice(device) {
    device.gatt.connect().then(() => {
        document.getElementById("device-name").innerText = device.name;
        document.getElementById("device-id").innerText = device.id;

        // Show status connected
        uiToggleDeviceConnected(true);

        // Get service
        device.gatt.getPrimaryService(USER_SERVICE_UUID).then(service => {
            liffGetUserService(service);
        }).catch(error => {
            uiDebugMessage("liffConnectToDevice - USER_SERVICE_UUID");
            uiStatusError(makeErrorMsg(error), false);
        });
        device.gatt.getPrimaryService(PSDI_SERVICE_UUID).then(service => {
            liffGetPSDIService(service);
        }).catch(error => {
            uiDebugMessage("liffConnectToDevice - PSDI_SERVICE_UUID");
            uiStatusError(makeErrorMsg(error), false);
        });


        // Device disconnect callback
        const disconnectCallback = () => {
            // Show status disconnected
            uiToggleDeviceConnected(false);

            // Remove disconnect callback
            device.removeEventListener('gattserverdisconnected', disconnectCallback);


            // Try to reconnect
            initializeLiff();
        };

        device.addEventListener('gattserverdisconnected', disconnectCallback);
    }).catch(error => {
        uiStatusError(makeErrorMsg(error), false);
    });
}

function liffGetUserService(service) {
    // Button pressed state
    service.getCharacteristic(MATRIX_CHARACTERISTIC_UUID).then(characteristic => {
        liffGetMatrixDataCharacteristic(characteristic);
    }).catch(error => {
        uiDebugMessage("liffGetUserService");
        uiStatusError(makeErrorMsg(error), false);
    });

    // Write CMD
    service.getCharacteristic(CMD_CHARACTERISTIC_UUID).then(characteristic => {
        window.cmdCharacteristic = characteristic;
        //
        //liffWriteCmdToDevice(false);
    }).catch(error => {
        uiStatusError(makeErrorMsg(error), false);
    });
}

function liffGetPSDIService(service) {
    // Get PSDI value
    service.getCharacteristic(PSDI_CHARACTERISTIC_UUID).then(characteristic => {
        return characteristic.readValue();
    }).then(value => {
        // Byte array to hex string
        const psdi = new Uint8Array(value.buffer)
            .reduce((output, byte) => output + ("0" + byte.toString(16)).slice(-2), "");
        document.getElementById("device-psdi").innerText = psdi;
    }).catch(error => {
        uiDebugMessage("liffGetPSDIService");
        uiStatusError(makeErrorMsg(error), false);
    });
}



function liffGetMatrixDataCharacteristic(characteristic) {
    characteristic.startNotifications().then(() => {
        characteristic.addEventListener('characteristicvaluechanged', e => {
            //const val = (new Uint8Array(e.target.value.buffer))[0];
            const data = (new Uint8Array(e.target.value.buffer));     //16Byte


            uiDebugMessage(data);

            var index = (data[0] << 8) + data[1];
            var length_index = (data[2] << 8) + data[3];
            var ir_freq = data[4];
            var ir_format = data[5];
            var rawcode_length = (data[6] << 8) + data[7];
            var code0 = (data[8] << 24) + (data[9] << 16) + (data[10] << 8) + data[11];
            var code1 = (data[12] << 24) + (data[13] << 16) + (data[14] << 8) + data[15];

            g_rawcode[index*2] = code0;
            g_rawcode[index*2 + 1] = code1;

            uiDebug1Message(index);
            uiDebug2Message(length_index);

            if(index == length_index-1){
                uiDebugMessage1(g_rawcode);

                document.getElementById("rawcode_length").innerText = rawcode_length;
                document.getElementById("code_format").innerText = ir_format;
                document.getElementById("freq").innerText = ir_freq;
                document.getElementById("rawcode").innerText = g_rawcode;
            }


        });
    }).catch(error => {
        uiDebugMessage("liffGetMatrixDataCharacteristic");
        uiStatusError(makeErrorMsg(error), false);
    });
}



function liffWriteLoadMatrix() {
    window.cmdCharacteristic.writeValue(
        new Uint8Array([0x02, 0, 0, 10])
    ).catch(error => {
        uiDebugMessage("liffWriteLoadMatrix");
        uiStatusError(makeErrorMsg(error), false);
    });
}
