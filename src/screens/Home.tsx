import { ImageSourcePropType, TouchableOpacity, View } from "react-native";

import { Camera, CameraType, FaceDetectionResult } from "expo-camera";

import { useEffect, useRef, useState } from "react";
import * as FaceDetector from "expo-face-detector";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import Icons from "@expo/vector-icons/MaterialIcons";

import neutral from "../../assets/neutral.png";
import winking from "../../assets/winking.png";
import smile from "../../assets/smile.png";

type Bounds = {
  size: {
    height: number;
    width: number;
  };
  origin: {
    x: number;
    y: number;
  };
};

const ALL_FACE_ROUNDED_DIFF = 50;

export function Home() {
  const cameraRef = useRef<Camera>(null);

  const [permissions, requestPermission] = Camera.useCameraPermissions();
  const [faceDetected, setFaceDetected] = useState(false);
  const [type, setType] = useState(CameraType.back);
  const [emoji, setEmoji] = useState<ImageSourcePropType>(neutral);

  function toggleCameraType() {
    setType((current) =>
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  }

  const faceValues = useSharedValue({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });

  const animatedStyle = useAnimatedStyle(() => ({
    position: "absolute",
    zIndex: 1,
    width: faceValues.value.width,
    height: faceValues.value.height,
    transform: [
      { translateX: faceValues.value.x },
      { translateY: faceValues.value.y },
    ],
  }));

  function handleFaceDetected({ faces }: FaceDetectionResult) {
    const face = faces[0] as {
      bounds: Bounds;
      smilingProbability: number;
      leftEyeOpenProbability: number;
      rightEyeOpenProbability: number;
    };

    if (face) {
      setFaceDetected(true);

      const { size, origin } = face.bounds;

      faceValues.value = {
        height: size.height + ALL_FACE_ROUNDED_DIFF,
        width: size.width + ALL_FACE_ROUNDED_DIFF,
        x: origin.x - ALL_FACE_ROUNDED_DIFF,
        y: origin.y - ALL_FACE_ROUNDED_DIFF,
      };

      if (face.smilingProbability > 0.5) {
        return setEmoji(smile);
      }

      const isWinking =
        (face.leftEyeOpenProbability > 0.5 &&
          face.rightEyeOpenProbability < 0.5) ||
        (face.leftEyeOpenProbability < 0.5 &&
          face.rightEyeOpenProbability > 0.5);

      if (isWinking) {
        return setEmoji(winking);
      }

      setEmoji(neutral);
    } else {
      setFaceDetected(false);
    }
  }

  useEffect(() => {
    requestPermission();
  }, []);

  if (!permissions?.granted) {
    return null;
  }

  return (
    <View className="bg-zinc-900 h-screen w-screen relative">
      {faceDetected ? (
        <Animated.Image source={emoji} style={animatedStyle} />
      ) : null}

      <TouchableOpacity
        className="absolute top-20 right-10 z-20"
        activeOpacity={0.8}
        onPress={toggleCameraType}
      >
        <Icons name="flip-camera-ios" size={60} color="white" />
      </TouchableOpacity>

      <Camera
        ref={cameraRef}
        className="flex-1"
        type={type}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.fast,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
          runClassifications: FaceDetector.FaceDetectorClassifications.all,
          minDetectionInterval: 100,
          tracking: true,
        }}
        onFacesDetected={handleFaceDetected}
      />
    </View>
  );
}
