let currentTrackIndex = 0;  // Индекс текущего трека

// Состояние плеера
let isPlaying = false;

document.addEventListener('DOMContentLoaded', async () => {
  // Инициализируем tippy
  tippy.setDefaultProps({
    delay: [200, 0],
    theme: 'light',
    animation: 'shift-away'
  });

  // Инициализируем кнопки управления
  initializePlayerControls();
  initializeProgressBar();

  // Загружаем последнюю выбранную папку
  const lastFolder = localStorage.getItem('lastFolder');
  if (lastFolder) {
    try {
      const allFiles = await window.electronAPI.loadFolderFiles(lastFolder);
      console.log('Загруженные файлы:', allFiles);
      
      // Фильтруем файлы по типу
      const audioFiles = allFiles.filter(file => file.toLowerCase().endsWith('.mp3'));
      
      await loadBookInfo(lastFolder, allFiles);  // Загружаем информацию о книге
      loadPlaylist(audioFiles);  // Загружаем только аудио файлы в плейлист
    } catch (error) {
      console.error('Ошибка при загрузке файлов:', error);
    }
  }

  // Загружаем последний проигрываемый файл
  const lastTrack = localStorage.getItem('lastTrack');
  const lastPosition = parseFloat(localStorage.getItem('lastPosition')) || 0;
  if (lastTrack) {
    const playlist = document.getElementById('playlist');
    const items = Array.from(playlist.querySelectorAll('li'));
    const index = items.findIndex(item => item.dataset.fullPath === lastTrack);
    playTrack(lastTrack, index, lastPosition);
  }

  // Добавляем обработчик для кнопки истории
  document.getElementById('toggleHistory').addEventListener('click', () => {
    const historyContainer = document.getElementById('history');
    if (historyContainer.style.display === 'none') {
      historyContainer.style.display = 'block';
      loadListeningHistory(); // Обновляем историю при показе
    } else {
      historyContainer.style.display = 'none';
    }
  });
});

// Функция для загрузки плейлиста
function loadPlaylist(files) {
  const playlist = document.getElementById('playlist');
  playlist.innerHTML = '';  // Очищаем список
  files.forEach((file, index) => {
    const li = document.createElement('li');
    const fileName = file.split('/').pop();

    // Добавляем иконку и имя файла
    li.innerHTML = `
      <i class="fas fa-book"></i>
      <span class="file-name">${fileName}</span>
    `;
    
    li.dataset.fullPath = file;
    li.onclick = () => playTrack(li.dataset.fullPath, index);
    
    // Добавляем атрибут для тултипа
    li.setAttribute('data-tippy-content', fileName);
    li.setAttribute('data-tippy-placement', 'right');

    playlist.appendChild(li);
  });

  // Инициализируем тултипы для всех элементов плейлиста
  tippy('[data-tippy-content]');
}

// Функция для проигрывания файла
function playTrack(file, index, startFrom = 0) {
  const audioPlayer = document.getElementById('audioPlayer');
  const playPauseBtn = document.getElementById('playPause');
  
  // Обновляем иконку на кнопке
  playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  isPlaying = true;
  
  // Преобразуем путь к файлу в URL формат
  const fileUrl = 'file://' + file;
  audioPlayer.src = fileUrl;
  
  audioPlayer.onloadedmetadata = () => {
    const position = startFrom ? Math.max(0, startFrom - 10) : 0;
    audioPlayer.currentTime = position;
    audioPlayer.play();
  };

  localStorage.setItem('lastTrack', file);
  if (index >= 0) currentTrackIndex = index;
  const currentTrack = document.getElementById('currentTrack');
  const fileName = file.split('/').pop();
  currentTrack.innerHTML = `
    <i class="fas fa-book-open"></i>
    <span>${fileName}</span>
  `;

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
      item.classList.add('playing');
    } else {
      item.classList.remove('playing');
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
  
  // Отображаем записи в обратном порядке (новые сверху)
  [...history].reverse().forEach(item => {
    const div = document.createElement('div');
    div.textContent = `${item.timestamp} - ${item.event} прослушивания файла: ${item.file}`;
    historyContainer.appendChild(div);
  });
}

// Кнопка выбора папки
// Функция загрузки информации о книге
async function loadBookInfo(folderPath, files) {
  console.log('Загружаем информацию о книге:');
  console.log('Путь к папке:', folderPath);
  console.log('Список файлов:', files);
  
  // Получаем название книги из последней папки в пути
  const bookTitle = folderPath.split('/').pop();
  document.getElementById('bookTitle').textContent = bookTitle;

  // Ищем файлы обложки
  console.log('Начинаем поиск изображений...');
  
  const imageFiles = files.filter(file => {
    console.log('Проверяем файл:', file);
    console.log('Расширение:', file.split('.').pop().toLowerCase());
    
    // Проверяем расширение
    const ext = file.split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png'].includes(ext);
    console.log('Это изображение?', isImage);
    return isImage;
  });
  
  console.log('Найденные изображения:', imageFiles);
  
  const coverFiles = imageFiles.sort((a, b) => a.localeCompare(b));

  const coverImg = document.getElementById('bookCover');
  const defaultCover = document.querySelector('.default-cover');

  if (coverFiles.length > 0) {
    // Берем первый (лексиграфически меньший) файл
    const selectedCover = coverFiles[0];
    console.log('Выбранная обложка:', selectedCover);
    
    // Добавляем протокол file:// и кодируем URI
    const coverPath = 'file://' + encodeURI(selectedCover);
    console.log('Полный путь к обложке:', coverPath);
    
    // Обработка загрузки изображения
    coverImg.onload = () => {
      console.log('Обложка успешно загружена');
      coverImg.style.display = 'block';
      defaultCover.style.display = 'none';
    };
    
    coverImg.onerror = (error) => {
      console.error('Ошибка загрузки обложки:', error);
      coverImg.style.display = 'none';
      defaultCover.style.display = 'block';
    };
    
    coverImg.src = coverPath;
  } else {
    coverImg.style.display = 'none';
    defaultCover.style.display = 'block';
  }
}

document.getElementById('selectFolder').addEventListener('click', async () => {
  try {
    const result = await window.electronAPI.selectFolder();
    if (result && result.files.length > 0) {
      localStorage.setItem('lastFolder', result.folderPath);
      
      // Фильтруем файлы по типу
      const audioFiles = result.files.filter(file => file.toLowerCase().endsWith('.mp3'));
      const allFiles = result.files; // Для поиска обложки
      
      await loadBookInfo(result.folderPath, allFiles);
      loadPlaylist(audioFiles);
    }
  } catch (error) {
    console.error('Ошибка при выборе папки:', error);
  }
});

// Логирование окончания прослушивания
function initializePlayerControls() {
  const audioPlayer = document.getElementById('audioPlayer');
  const playPauseBtn = document.getElementById('playPause');
  const prevBtn = document.getElementById('prevTrack');
  const nextBtn = document.getElementById('nextTrack');

  playPauseBtn.onclick = togglePlayPause;
  prevBtn.onclick = playPreviousTrack;
  nextBtn.onclick = playNextTrack;

  // Обработка окончания трека
  audioPlayer.addEventListener('ended', () => {
    const endTime = new Date().toISOString();
    const cleanPath = audioPlayer.src.replace('file://', '');
    logListeningHistory(cleanPath, endTime, 'end');
    saveHistoryToUI(cleanPath, endTime, 'Конец');
    playNextTrack();
  });
}

function initializeProgressBar() {
  const audioPlayer = document.getElementById('audioPlayer');
  const progressBar = document.getElementById('progressBar');
  const progress = document.getElementById('progress');

  // Обновление прогресс-бара
  audioPlayer.addEventListener('timeupdate', () => {
    const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progress.style.width = percent + '%';
  });

  // Перемотка по клику
  progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / progressBar.offsetWidth;
    audioPlayer.currentTime = pos * audioPlayer.duration;
  });
}

function togglePlayPause() {
  const audioPlayer = document.getElementById('audioPlayer');
  const playPauseBtn = document.getElementById('playPause');
  
  if (audioPlayer.paused) {
    audioPlayer.play();
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    isPlaying = true;
  } else {
    audioPlayer.pause();
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    isPlaying = false;
  }
}

function playPreviousTrack() {
  if (currentTrackIndex > 0) {
    const playlist = document.getElementById('playlist');
    const items = Array.from(playlist.querySelectorAll('li'));
    currentTrackIndex--;
    playTrack(items[currentTrackIndex].dataset.fullPath, currentTrackIndex);
  }
}

function playNextTrack() {
  const playlist = document.getElementById('playlist');
  const items = Array.from(playlist.querySelectorAll('li'));
  if (currentTrackIndex < items.length - 1) {
    currentTrackIndex++;
    playTrack(items[currentTrackIndex].dataset.fullPath, currentTrackIndex);
  }
}

// Сохранение лога в UI
function saveHistoryToUI(file, timestamp, eventType) {
  const historyContainer = document.getElementById('history');
  const div = document.createElement('div');
  const fileName = file.split('/').pop();
  div.innerHTML = `
    <i class="fas fa-${eventType === 'Конец' ? 'stop-circle' : 'play-circle'}"></i>
    ${timestamp} - ${eventType} прослушивания: ${fileName}
  `;
  // Добавляем новые записи в начало
  historyContainer.insertBefore(div, historyContainer.firstChild);
  
  // Добавляем атрибут для тултипа
  div.setAttribute('data-tippy-content', file);
  div.setAttribute('data-tippy-placement', 'right');
  tippy(div);
}