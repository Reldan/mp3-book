let currentTrackIndex = 0;  // Индекс текущего трека

document.addEventListener('DOMContentLoaded', async () => {
  // Загружаем последнюю выбранную папку
  const lastFolder = localStorage.getItem('lastFolder');
  if (lastFolder) {
    try {
      const files = await window.electronAPI.loadFolderFiles(lastFolder);
      console.log('Загруженные файлы:', files);
      loadPlaylist(files);  // Загружаем файлы в плейлист
    } catch (error) {
      console.error('Ошибка при загрузке файлов:', error);
    }
  }

  // Загружаем последний проигрываемый файл и его позицию
  const lastTrack = localStorage.getItem('lastTrack');
  const lastPosition = localStorage.getItem('lastPosition');
  if (lastTrack) {
    const audioPlayer = document.getElementById('audioPlayer');
    const fileUrl = 'file://' + lastTrack;
    audioPlayer.src = fileUrl;
    audioPlayer.currentTime = parseFloat(lastPosition) || 0;
    audioPlayer.play();
    document.getElementById('currentTrack').textContent = `Сейчас играет: ${lastTrack}`;
    highlightCurrentTrack(lastTrack); // Подсвечиваем текущий трек
  }

  // Загружаем историю прослушивания
  loadListeningHistory();
});

// Функция для загрузки плейлиста
function loadPlaylist(files) {
  const playlist = document.getElementById('playlist');
  playlist.innerHTML = '';  // Очищаем список
  files.forEach((file, index) => {
    const li = document.createElement('li');
    li.textContent = file.split('/').pop(); // Показываем только имя файла
    li.dataset.fullPath = file; // Сохраняем полный путь
    li.onclick = () => playTrack(li.dataset.fullPath, index);
    playlist.appendChild(li);
  });
}

// Функция для проигрывания файла
function playTrack(file, index) {
  const audioPlayer = document.getElementById('audioPlayer');
  // Преобразуем путь к файлу в URL формат
  const fileUrl = 'file://' + file;
  audioPlayer.src = fileUrl;
  audioPlayer.play();
  localStorage.setItem('lastTrack', file);  // Сохраняем путь последнего файла
  localStorage.setItem('lastPosition', 0); // Сброс позиции при новом треке
  currentTrackIndex = index;  // Обновляем индекс текущего трека
  document.getElementById('currentTrack').textContent = `Сейчас играет: ${file}`;

  // Подсвечиваем выбранный файл
  highlightCurrentTrack(file);

  // Сохраняем позицию в процессе проигрывания
  audioPlayer.ontimeupdate = () => {
    localStorage.setItem('lastPosition', audioPlayer.currentTime);
  };

  // Логируем начало прослушивания
  const startTime = new Date().toISOString();
  logListeningHistory(file, startTime, 'start');
}

// Подсветка текущего файла в плейлисте
function highlightCurrentTrack(file) {
  const playlistItems = document.querySelectorAll('#playlist li');
  playlistItems.forEach(item => {
    if (item.dataset.fullPath === file) {
      item.style.backgroundColor = '#555';  // Подсветка выбранного файла
    } else {
      item.style.backgroundColor = '#333';  // Обычный фон для остальных файлов
    }
  });
}

// Логирование истории прослушивания
function logListeningHistory(file, timestamp, eventType) {
  let history = JSON.parse(localStorage.getItem('listeningHistory')) || [];
  history.push({
    file,
    timestamp,
    event: eventType
  });
  localStorage.setItem('listeningHistory', JSON.stringify(history));
  if (eventType === 'start') {
    saveHistoryToUI(file, timestamp, 'Начало');
  }
}

// Отображение истории прослушивания
function loadListeningHistory() {
  const history = JSON.parse(localStorage.getItem('listeningHistory')) || [];
  const historyContainer = document.getElementById('history');
  historyContainer.innerHTML = '';  // Очищаем историю на странице
  history.forEach(item => {
    const div = document.createElement('div');
    div.textContent = `${item.timestamp} - ${item.event} прослушивания файла: ${item.file}`;
    historyContainer.appendChild(div);
  });
}

// Кнопка выбора папки
document.getElementById('selectFolder').addEventListener('click', async () => {
  const files = await window.electronAPI.selectFolder();
  if (files) {
    localStorage.setItem('lastFolder', files[0].split('/').slice(0, -1).join('/'));
    loadPlaylist(files);
  }
});

// Логирование окончания прослушивания
document.getElementById('audioPlayer').addEventListener('ended', () => {
  const audioPlayer = document.getElementById('audioPlayer');
  const endTime = new Date().toISOString();
  // Удаляем префикс file:// из пути
  const cleanPath = audioPlayer.src.replace('file://', '');
  logListeningHistory(cleanPath, endTime, 'end');
  saveHistoryToUI(cleanPath, endTime, 'Конец');

  // Переход к следующему треку, если он есть
  const playlist = document.getElementById('playlist');
  const files = Array.from(playlist.querySelectorAll('li')).map(li => li.dataset.fullPath);
  if (currentTrackIndex < files.length - 1) {
    currentTrackIndex++; // Переходим к следующему файлу
    playTrack(files[currentTrackIndex], currentTrackIndex);  // Проигрываем следующий файл
  }
});

// Сохранение лога в UI
function saveHistoryToUI(file, timestamp, eventType) {
  const historyContainer = document.getElementById('history');
  const div = document.createElement('div');
  div.textContent = `${timestamp} - ${eventType} прослушивания файла: ${file}`;
  historyContainer.appendChild(div);
}