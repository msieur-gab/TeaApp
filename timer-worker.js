// timer-worker.js
// An optimized timer worker that is more accurate across sleep/wake cycles

let timerInterval;
let targetTime;
let timeRemaining;
let originalDuration;
let isPaused = true;
let teaName = '';

self.onmessage = function(e) {
  const command = e.data.command;
  
  switch (command) {
    case 'start':
      startTimer(e.data.duration, e.data.teaName);
      break;
    case 'pause':
      pauseTimer();
      break;
    case 'resume':
      resumeTimer();
      break;
    case 'reset':
      resetTimer(e.data.duration);
      break;
    case 'stop':
      stopTimer();
      break;
    case 'sync':
      // Just report current time
      self.postMessage({ 
        type: 'update', 
        timeRemaining: timeRemaining,
        originalDuration: originalDuration
      });
      break;
    case 'addTime':
      addTime(e.data.seconds);
      break;
  }
};

function startTimer(duration, name = 'tea') {
  timeRemaining = duration;
  originalDuration = duration;
  targetTime = Date.now() + (duration * 1000);
  teaName = name;
  isPaused = false;
  
  // Initial update
  self.postMessage({ 
    type: 'update', 
    timeRemaining: timeRemaining,
    originalDuration: originalDuration
  });
  
  runTimer();
}

function runTimer() {
  clearInterval(timerInterval);
  
  // Use a more frequent interval for better accuracy
  timerInterval = setInterval(() => {
    if (!isPaused) {
      // Calculate time based on actual timestamp difference
      // This ensures accuracy even if device goes to sleep
      const now = Date.now();
      const newTimeRemaining = Math.max(0, Math.round((targetTime - now) / 1000));
      
      // Only send updates when the value changes to reduce messages
      if (newTimeRemaining !== timeRemaining) {
        timeRemaining = newTimeRemaining;
        
        // Send update to the main thread
        self.postMessage({ 
          type: 'update', 
          timeRemaining: timeRemaining,
          originalDuration: originalDuration
        });
      }
      
      // Check if timer is finished
      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        self.postMessage({ 
          type: 'complete',
          teaName: teaName
        });
      }
    }
  }, 100); // Check 10 times per second for better accuracy
}

function pauseTimer() {
  if (!isPaused) {
    isPaused = true;
    // Store remaining time when paused
    timeRemaining = Math.max(0, Math.round((targetTime - Date.now()) / 1000));
    clearInterval(timerInterval);
    
    // Notify main thread of pause
    self.postMessage({ 
      type: 'paused', 
      timeRemaining: timeRemaining,
      originalDuration: originalDuration
    });
  }
}

function resumeTimer() {
  if (isPaused && timeRemaining > 0) {
    // Reset target time based on current time
    targetTime = Date.now() + (timeRemaining * 1000);
    isPaused = false;
    
    // Notify main thread of resume
    self.postMessage({ 
      type: 'resumed', 
      timeRemaining: timeRemaining,
      originalDuration: originalDuration
    });
    
    runTimer();
  }
}

function resetTimer(duration) {
  clearInterval(timerInterval);
  timeRemaining = duration || originalDuration;
  originalDuration = timeRemaining;
  isPaused = true;
  
  // Notify main thread of reset
  self.postMessage({ 
    type: 'reset', 
    timeRemaining: timeRemaining,
    originalDuration: originalDuration
  });
}

function stopTimer() {
  clearInterval(timerInterval);
  isPaused = true;
  
  // Notify main thread of stop
  self.postMessage({ 
    type: 'stopped', 
    timeRemaining: timeRemaining,
    originalDuration: originalDuration
  });
}

function addTime(seconds) {
  // Add time to the current timer
  if (isPaused) {
    timeRemaining += seconds;
  } else {
    targetTime += seconds * 1000;
    timeRemaining = Math.max(0, Math.round((targetTime - Date.now()) / 1000));
  }
  
  // Notify main thread of the time change
  self.postMessage({ 
    type: 'update', 
    timeRemaining: timeRemaining,
    originalDuration: originalDuration
  });
}
