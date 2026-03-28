import { View, Text, Button, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/useAuthStore';
import * as FileSystem from 'expo-file-system';
import {  createPost, uploadVideoToStorage } from '@/services/posts';

// ─── Root ────────────────────────────────────────────────────────────────────

export default function NewPostScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [videoUri, setVideoUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (permission && !permission.granted && permission.canAskAgain) {
        await requestPermission();
      }
      if (micPermission && !micPermission.granted && micPermission.canAskAgain) {
        await requestMicPermission();
      }
    })();
  }, [permission, micPermission]);

  if (!permission || !micPermission) {
    return <View />;
  }

  if (
    (permission && !permission.granted && !permission.canAskAgain) ||
    (micPermission && !micPermission.granted && !micPermission.canAskAgain)
  ) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need your permission to use the camera and microphone
        </Text>
        <Button title="Grant Permission" onPress={() => Linking.openSettings()} />
      </View>
    );
  }

  if (videoUri) {
    return <VideoPreview uri={videoUri} onDiscard={() => setVideoUri(null)} />;
  }

  return <CameraScreen onVideoRecorded={setVideoUri} />;
}

// ─── Camera ──────────────────────────────────────────────────────────────────

function CameraScreen({ onVideoRecorded }: { onVideoRecorded: (uri: string) => void }) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const isRecordingRef = useRef(false);

  const startRecording = async () => {
    if (isRecordingRef.current) return;
    isRecordingRef.current = true;
    setIsRecording(true);
    try {
      const result = await cameraRef.current?.recordAsync();
      if (result?.uri) {
        onVideoRecorded(result.uri);
      }
    } catch (e) {
      console.log('Recording stopped');
    } finally {
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    cameraRef.current?.stopRecording();
  };

  const selectFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images','videos', 'livePhotos'],
      allowsEditing: true,
      aspect: [9, 16],
    });
    if (!result.canceled) {
      onVideoRecorded(result.assets[0].uri);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <CameraView ref={cameraRef} mode="video" style={{ flex: 1 }} facing={facing} />

      <View style={styles.topBar}>
        <Ionicons name="close" size={40} color="white" onPress={() => router.back()} />
      </View>

      <View style={styles.bottomControls}>
        <Ionicons name="images" size={40} color="white" onPress={selectFromGallery} />
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordingButton]}
          onPress={isRecording ? stopRecording : startRecording}
        />
        <Ionicons
          name="camera-reverse"
          size={40}
          color="white"
          onPress={() => setFacing(f => (f === 'back' ? 'front' : 'back'))}
        />
      </View>
    </View>
  );
}

// ─── Preview ─────────────────────────────────────────────────────────────────

function VideoPreview({ uri, onDiscard }: { uri: string; onDiscard: () => void }) {
  const [description, setDescription] = useState('');
  const user = useAuthStore((state: any) => state.user);
  const queryClient = useQueryClient();

  const player = useVideoPlayer(uri, p => {
    p.loop = true;
    p.play();
  });

  const { mutate: createNewPost, isPending } = useMutation({
    mutationFn: async ({ video, description }: { video: string; description: string }) => {
      const fileExtension = video.split('.').pop() || 'mp4';
      const fileName = `${user?.id}/${Date.now()}.${fileExtension}`;
      const file = new FileSystem.File(video);
      const fileBuffer = await file.bytes();
      if (user) {
        const videoUrl = await uploadVideoToStorage({ fileName, fileExtension, fileBuffer });
       // createPost({ video_url: videoUrl, description, user_id: user?.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      router.replace('/');
    },
    onError: () => {
      Alert.alert('Error', 'Something went wrong. Try again!');
    },
  });

  return (
    <View style={{ flex: 1 }}>
      <Ionicons
        name="close"
        size={32}
        color="white"
        onPress={onDiscard}
        style={styles.closeIcon}
      />

      <View style={styles.videoWrapper}>
        <VideoView player={player} contentFit="cover" style={styles.video} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' || Platform.OS === 'android' ? 'padding' : undefined}
        style={styles.descriptionContainer}
        keyboardVerticalOffset={20}
      >
        <TextInput
          style={styles.input}
          placeholder="Add a description..."
          placeholderTextColor="#aaa"
          multiline
          value={description}
          onChangeText={setDescription}
        />
        <TouchableOpacity
          style={styles.postButton}
          onPress={() => createNewPost({ video: uri, description })}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.postText}>Post</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
  },
  recordButton: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 40,
  },
  recordingButton: {
    backgroundColor: '#F44336',
  },
  topBar: {
    position: 'absolute',
    top: 55,
    left: 15,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  closeIcon: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  video: {
    aspectRatio: 9 / 16,
  },
  input: {
    flex: 1,
    color: 'white',
    backgroundColor: '#111',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 10,
    maxHeight: 110,
  },
  postText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  postButton: {
    backgroundColor: '#FF0050',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  videoWrapper: {
    flex: 1,
  },
  descriptionContainer: {
    paddingHorizontal: 5,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
});