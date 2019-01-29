
//UUID正しいの書き込み済み


// User service UUID: Change this to your generated service UUID
const USER_SERVICE_UUID           = 'b8718b56-80a2-4a05-a224-c35a5a9accb0'; // CMD
const CMD_CHARACTERISTIC_UUID     = '95243321-cb66-4137-802f-4cb51fd4818d';
const MATRIX_CHARACTERISTIC_UUID  = '943f94a6-3a7e-45df-8614-1e5f61fe334f';

// PSDI Service UUID: Fixed value for Developer Trial
const PSDI_SERVICE_UUID         = 'e625601e-9e55-4597-a598-76018a0d293d'; // Device ID
const PSDI_CHARACTERISTIC_UUID  = '26e2b12b-85f0-4f3f-9fdd-91d114270e6e';



// Matrix data
let g_color_matrix8x8 = [];




// -------------- //
// On window load //
// -------------- //

window.onload = () => {
    initializeApp();

    var adder_v = 0;
    var color_matrix = [];///[144, 044, 50, 1, 32, 32, 32, 55, 89, 32, 50, 32, 2, 32, 66, 54];

    for(var i = 0; i < 8; i = i + 1){
        g_color_matrix8x8[i] = [25, 25, 25, 25, 25, 25, 25, 25];//[];
    }

    writeColorSample();
    drawMatrix320x320();

        var test1 = convertTemo2ColorHsv(0);
            var test2 = convertTemo2ColorHsv(50);
                var test3 = convertTemo2ColorHsv(99);

};

function writeColorSample(){
  var canvas = document.getElementById('color_sample');
  var context = canvas.getContext('2d');

  var i = 0;
  var j = 0;

  for(var i = 0; i < 100; i = i + 1){
    context.fillStyle = convertTemo2ColorHsv(i);//convertTemp2Color(i);//chroma.temperature(color_data[i][j]);
    context.fillRect(i*2, 1, 2, 10);
  }
}


function convertTemo2ColorHsv(temp){
  var color_value = 240 - ((240 / 100) * temp);
  var hsv_color =  chroma.hsv(color_value, 1, 1);
  return hsv_color;
}

function convertTemp2Color(temp){
  var magnification = 1.8;//180 / 100;    //範囲
  var white_start = 150;

  var blue;
  if(magnification * temp < 100){
    blue = Math.cos(3.141592/100*(magnification*temp)) * 0.5 + 0.5;   //0 ~ 1
    blue = blue * 255
  }else if(magnification * temp > white_start){
    blue = (255 / (180 - white_start)) * ((magnification * temp) - white_start);
  }else{
    blue = 0;
  }

  var green = Math.sin(3.141592/100 * magnification * temp);
  if(magnification * temp > white_start){
    green = (255 / (180 - white_start)) * ((magnification * temp) - white_start);
  }else{
    green = green * 255;
  }

  var red;
  if(magnification * temp > 50){
    red = Math.cos(3.141592/100*(magnification*temp + 90)) * 0.5 + 0.5;   //0 ~ 1
    red = red * 255
  }else if(magnification * temp > white_start){
    red = (255 / (180 - white_start)) * ((magnification * temp) - white_start);
  }else{
    red = 0;
  }

  return chroma(red, green, blue)

}


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
            const matrix = (new Uint8Array(e.target.value.buffer));     //16Byte

            //Detect Color
            var color_matrix = [];
            for(var i = 0; i < 16; i = i + 1){
                color_matrix[i] = matrix[i] & 0x7f;
            }

            //Detect V-Address
            var v_address = 0;
            v_address = ((matrix[0] & 0x80) >> 7) + ((matrix[1] & 0x80) >> 6);

            //Draw Color matrix
            uiDebugMessage(matrix);
            uiDebug1Message(color_matrix);
            uiDebug2Message(v_address);

            for(var i = 0; i < 8; i = i + 1){
                g_color_matrix8x8[v_address*2][i] = color_matrix[i];
                g_color_matrix8x8[v_address*2+1][i] = color_matrix[i+8];
            }
            if(v_address == 3){
                drawMatrix320x320();
                uiDebug1Message("Stop");
                uiDebug2Message(g_color_matrix8x8);

                if (document.config.get_singleshot.checked){
                  window.cmdCharacteristic.writeValue(
                      new Uint8Array([0x04, 0, 0, 0])
                  ).catch(error => {
                      uiDebugMessage("oneshot");
                      uiStatusError(makeErrorMsg(error), false);
                  });
                }
            }

        });
    }).catch(error => {
        uiDebugMessage("liffGetMatrixDataCharacteristic");
        uiStatusError(makeErrorMsg(error), false);
    });
}


function drawMatrix320x320(){
  var canvas_original = document.getElementById('matrix_original');
  var context_original = canvas_original.getContext('2d');

  var canvas_320x320 = document.getElementById('matrix_320x320');
  var context_320x320 = canvas_320x320.getContext('2d');

  context_320x320.drawImage(canvas_original,0,0);


  var destination = context_320x320.createImageData(320, 320);
  //var src_imagedata = ctx.createImageData(8, 8);
  var src_imagedata = new ImageData(8, 8);

  //最大、最低温度取得
  var array_min = [];
  var array_max = [];

  for(i = 0; i < 8; i = i + 1){
    array_max[i] = Math.max.apply(null, g_color_matrix8x8[i]);
    array_min[i] = Math.min.apply(null, g_color_matrix8x8[i]);
  }
  var max = Math.max.apply(null, array_max);
  var min = Math.min.apply(null, array_min);

  document.getElementById("max_temp").innerText = max + "℃";
  document.getElementById("min_temp").innerText = min + "℃";

  var magnification = 1;
  if (document.config.adj_range.checked){
    if(max * 4 < 100){
      magnification = 4;
    }else if(max * 3 < 100){
      magnification = 3;
    }else if(max * 2 < 100){
      magnification = 2;
    }
    
  }

  //Draw Matrix
  for(var i = 0; i < 8; i = i + 1){
    for(var j = 0; j < 8; j = j + 1){

      var pixel_color = convertTemo2ColorHsv(g_color_matrix8x8[j][i] * magnification);

      var red = pixel_color.get( "rgb.r" );
      var green = pixel_color.get( "rgb.g" );
      var blue = pixel_color.get( "rgb.b" );

      src_imagedata.data[i * 32 + j * 4] = red;
      src_imagedata.data[i * 32 + j * 4 + 1] = green;
      src_imagedata.data[i * 32 + j * 4 + 2] = blue;
      src_imagedata.data[i * 32 + j * 4 + 3] = 255;//alpha;
    }
  }

  // Perform scaling (拡大縮小の実行)
  EffectResampling(src_imagedata,destination,BiCubic_Filter,false);

  // Draw to canvas (canvasへ描画)
  context_320x320.putImageData(destination,0,0);
}


function liffWriteLoadMatrix() {
    window.cmdCharacteristic.writeValue(
        new Uint8Array([0x02, 0, 0, 10])
    ).catch(error => {
        uiDebugMessage("liffWriteLoadMatrix");
        uiStatusError(makeErrorMsg(error), false);
    });
}
