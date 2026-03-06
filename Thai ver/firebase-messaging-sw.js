importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// 파이어베이스 설정 (기존과 동일)
firebase.initializeApp({
  apiKey: "AIzaSyBj95DwWp_DODz13YA0bsFEaBsK9hnjmN0",
  authDomain: "samhwa-mt.firebaseapp.com",
  projectId: "samhwa-mt",
  storageBucket: "samhwa-mt.firebasestorage.app",
  messagingSenderId: "833371319268",
  appId: "1:833371319268:web:7f2495002a504dd858b5f1",
  measurementId: "G-VVRJSR9M5Z"
});

const messaging = firebase.messaging();

// 앱이 백그라운드 상태일 때 알림을 수신하는 로직
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] 백그라운드 메시지 수신: ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // 앱 아이콘 경로
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});