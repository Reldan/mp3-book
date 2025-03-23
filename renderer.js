document.addEventListener('DOMContentLoaded', async () => {
    // Загружаем последнюю выбранную папку
    const lastFolder = localStorage.getItem('lastFolder');
    if (lastFolder) {
      try {
        const files = await window.electronAPI.loadFolderFiles(lastFolder);
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
      audioPlayer.src = lastTrack;
      audioPlayer.currentTime = parseFloat(lastPosition) || 0;
      audioPlayer.play();
      document.getElementById('currentTrack').textContent = `Сейчас играет: ${lastTrack}`;
      highlightCurrentTrack(lastTrack); // Подсвечиваем текущий трек
    }
  });
  
  // Функция для загрузки плейлиста
  function loadPlaylist(files) {
    const playlist = document.getElementById('playlist');
    playlist.innerHTML = '';  // Очищаем список
    files.forEach((file, index) => {
      const li = document.createElement('li');
      li.textContent = file.split('/').pop();
      li.onclick = () => playTrack(file, index);
      playlist.appendChild(li);
    });
  }
  
  // Функция для проигрывания файла
  function playTrack(file, index) {
    const audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.src = file;
    audioPlayer.play();
    localStorage.setItem('lastTrack', file);  // Сохраняем путь последнего файла
    localStorage.setItem('lastPosition', 0); // Сброс позиции при новом треке
    document.getElementById('currentTrack').textContent = `Сейчас играет: ${file}`;
  
    // Подсвечиваем выбранный файл
    highlightCurrentTrack(file);
  
    // Сохраняем позицию в процессе проигрывания
    audioPlayer.ontimeupdate = () => {
      localStorage.setItem('lastPosition', audioPlayer.currentTime);
    };
  }
  
  // Подсветка текущего файла в плейлисте
  function highlightCurrentTrack(file) {
    const playlistItems = document.querySelectorAll('#playlist li');
    playlistItems.forEach(item => {
      if (item.textContent === file.split('/').pop()) {
        item.style.backgroundColor = '#555';  // Подсветка выбранного файла
      } else {
        item.style.backgroundColor = '#333';  // Обычный фон для остальных файлов
      }
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