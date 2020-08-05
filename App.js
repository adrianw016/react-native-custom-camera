import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Dimensions,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  PermissionsAndroid,
  Alert,
  Button
} from "react-native";
import { RNCamera, FaceDetector } from 'react-native-camera';

import Video from 'react-native-video';
import RNFetchBlob from 'rn-fetch-blob'
import CameraRoll from "@react-native-community/cameraroll";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// import {PERMISSIONS} from 'react-native-permissions';

const WINDOW_HEIGHT = Dimensions.get("window").height;
const WINDOW_WIDTH = Dimensions.get("window").width;

const closeButtonSize = Math.floor(WINDOW_HEIGHT * 0.032);
const captureSize = Math.floor(WINDOW_HEIGHT * 0.09);

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false)

  const [cameraType, setCameraType] = useState(RNCamera.Constants.Type.back);
  console.log("App -> cameraType", cameraType)
  const [cameraFlash, setcameraFlash] = useState(RNCamera.Constants.FlashMode.off)
  // const [cameraFlashIcon, setcameraFlashIcon] = useState('Flash Off')
  // const [cameraFlashIcon, setcameraFlashIcon] = useState(<Icon name="flash-off" size={30} color="#fff" />)

  const [isPreview, setIsPreview] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoSource, setVideoSource] = useState(null);
  const cameraRef = useRef();

  useEffect(() => {
    (async () => {
      const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, PermissionsAndroid.PERMISSIONS.AUDIO_RECORDING);
      setHasPermission(status === "granted");
    })();
  }, []);

  const onCameraReady = () => {
    setIsCameraReady(true);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const options = { quality: 0.5, base64: true, skipProcessing: true };
      const data = await cameraRef.current.takePictureAsync(options);
      const source = data.uri;
      Alert.alert("Picture Taken!", JSON.stringify(source, null, 2));
      if (source) {
        await cameraRef.current.pausePreview();
        setIsPreview(true);

        // CameraRoll.save(source, { type: 'photo' }).then((res) => {
        // }).then(() => {
        //   RNFetchBlob.fs.unlink(source)
        // })
      }
    }
  };

  const recordVideo = async () => {
    if (cameraRef.current) {
      try {

        const videoRecordPromise = cameraRef.current.recordAsync();

        if (videoRecordPromise) {
          setIsVideoRecording(true);
          const data = await videoRecordPromise;
          console.log("recordVideo -> data", data)
          const source = data.uri;
          Alert.alert("Video recorded!", JSON.stringify(source));

          if (source) {
            setIsPreview(true);
            setVideoSource(source);
          }
        }
      } catch (error) {
        console.warn(error);
      }
    }
  };

  const stopVideoRecording = () => {
    if (cameraRef.current) {
      setIsPreview(false);
      setIsVideoRecording(false);
      cameraRef.current.stopRecording();
    }
  };

  const switchCamera = () => {
    if (isPreview) {
      return;
    }
    setCameraType((prevCameraType) =>
      prevCameraType === RNCamera.Constants.Type.back
        ? RNCamera.Constants.Type.front
        : RNCamera.Constants.Type.back
    );
  };

  const handleFlash = () => {
    if (isPreview) {
      return;
    }

    console.log("handleFlash -> cameraFlash", cameraFlash)

    setcameraFlash((prevCameraType) =>
      prevCameraType === RNCamera.Constants.FlashMode.off
        ? RNCamera.Constants.FlashMode.on
        : RNCamera.Constants.FlashMode.off
    );
  };

  const cancelPreview = async () => {
    await cameraRef.current.resumePreview();
    setIsPreview(false);
    setVideoSource(null);
  };

  const renderCancelPreviewButton = () => (
    <TouchableOpacity style={{ top: 15, left: 15 }} onPress={cancelPreview}>
      <Icon name="close-circle" size={30} color="#fff" />
    </TouchableOpacity>
  );

  const renderVideoPlayer = () => (
    <Video
      source={{ uri: videoSource }}
      shouldPlay={true}
      style={styles.media}
    />
  );

  const renderVideoRecordIndicator = () => (
    <View style={styles.recordIndicatorContainer}>
      <View style={styles.recordDot} />
      <Text style={styles.recordTitle}>{"Recording"}</Text>
    </View>
  );

  const renderCaptureControl = () => (
    <View style={styles.control}>
      <TouchableOpacity disabled={!isCameraReady} onPress={switchCamera}>
        {/* <Text style={styles.text}>{"Flip"}</Text> */}
        <Icon name="camera-party-mode" size={30} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={!isCameraReady}
        onLongPress={recordVideo}
        onPressOut={stopVideoRecording}
        onPress={takePicture}
      // style={styles.capture}
      >
        <View style={{
          width: WINDOW_WIDTH / 2,
          height: captureSize,
          // marginHorizontal: 31,
          justifyContent: "center",
          alignItems: 'center',
          // flexDirection:'row',
        }}>
          <Icon name="circle-slice-8" size={60} color="#fff" />
        </View>
      </TouchableOpacity>

      {/* <Icon name="circle-slice-8" size={60} color="#fff" /> */}

      <TouchableOpacity disabled={!isCameraReady} onPress={handleFlash}>
        {/* <Text style={styles.text}>{cameraFlashIcon}</Text> */}
        {cameraFlash ?
          <Icon name="flash" size={30} color="#fff" /> :
          <Icon name="flash-off" size={30} color="#fff" />}
      </TouchableOpacity>

      <TouchableOpacity style={{ position: 'absolute', top: -600, right: 320 }} onPress={() => { setIsCameraOpen(false), setIsCameraReady(false) }}>
        <Icon name="arrow-left" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  if (hasPermission === null) {
    return <View />;
  }

  if (hasPermission === false) {
    return <Text style={styles.text}>No access to RNCamera</Text>;
  }

  return (
    <View style={{
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1
    }}>
      {!isCameraOpen && <Button title='Open Camera' onPress={() => setIsCameraOpen(true)}></Button>}
      {isCameraOpen && <SafeAreaView style={styles.container}>
        <RNCamera
          ref={cameraRef}
          style={styles.container}
          ratio={'16:9'}
          type={cameraType}
          // flashMode={RNCamera.Constants.FlashMode.off}
          flashMode={cameraFlash}
          onCameraReady={onCameraReady}
          onMountError={(error) => {
          }}
        />
        <View style={styles.container}>
          {isVideoRecording && renderVideoRecordIndicator()}
          {videoSource && renderVideoPlayer()}
          {isPreview && renderCancelPreviewButton()}
          {!videoSource && !isPreview && renderCaptureControl()}
        </View>
        {/* <TouchableOpacity style={{ top: 15, left: 15 }} onPress={() => { setIsCameraOpen(false), setIsCameraReady(false) }}>
          <Icon name="arrow-left" size={30} color="#fff" />
        </TouchableOpacity> */}
      </SafeAreaView>}
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  closeButton: {
    position: "absolute",
    top: 35,
    left: 15,
    height: closeButtonSize,
    width: closeButtonSize,
    borderRadius: Math.floor(closeButtonSize / 2),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#c4c5c4",
    opacity: 0.7,
    zIndex: 2,
  },
  media: {
    ...StyleSheet.absoluteFillObject,
  },
  closeCross: {
    width: "68%",
    height: 1,
    backgroundColor: "black",
  },
  control: {
    position: "absolute",
    flexDirection: "row",
    bottom: 38,
    width: WINDOW_WIDTH,
    alignItems: "center",
    justifyContent: 'center',
  },
  capture: {
    backgroundColor: "#f5f6f5",
    borderRadius: 5,
    height: captureSize,
    width: captureSize,
    borderRadius: Math.floor(captureSize / 2),
    marginHorizontal: 31,
  },
  recordIndicatorContainer: {
    flexDirection: "row",
    position: "absolute",
    top: 25,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    opacity: 0.7,
  },
  recordTitle: {
    fontSize: 14,
    color: "#ffffff",
    textAlign: "center",
  },
  recordDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
    backgroundColor: "#ff0000",
    marginHorizontal: 5,
  },
  text: {
    color: "#fff",
  },
});