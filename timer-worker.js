// timer-worker.js
// This worker uses the system time to ensure accurate timing
// even if the device goes to sleep mode or the app is in the background

let timerInterval;
let targetTime;
let timeRemaining;
let isPaused = true;

self.onmessage = function(e) {
  const command = e.data.command;
  
  switch (command) {
    case 'start':
      startTimer(e.data.duration);
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
        timeRemaining: timeRemaining 
      });
      break;
  }
};

function startTimer(duration) {
  timeRemaining = duration;
  targetTime = Date.now() + (duration * 1000);
  isPaused = false;
  
  // Initial update
  self.postMessage({ 
    type: 'update', 
    timeRemaining: timeRemaining 
  });
  
  runTimer();
}

function runTimer() {
  clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    if (!isPaused) {
      // Calculate time based on actual timestamp difference
      // This ensures accuracy even if device goes to sleep
      const now = Date.now();
      timeRemaining = Math.max(0, Math.round((targetTime - now) / 1000));
      
      // Send update to the main thread
      self.postMessage({ 
        type: 'update', 
        timeRemaining: timeRemaining 
      });
      
      // Check if timer is finished
      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        self.postMessage({ type: 'complete' });
      }
    }
  }, 500); // Check twice per second for better accuracy
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
      timeRemaining: timeRemaining 
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
      timeRemaining: timeRemaining 
    });
    
    runTimer();
  }
}

function resetTimer(duration) {
  clearInterval(timerInterval);
  timeRemaining = duration;
  isPaused = true;
  
  // Notify main thread of reset
  self.postMessage({ 
    type: 'reset', 
    timeRemaining: timeRemaining 
  });
}

function stopTimer() {
  clearInterval(timerInterval);
  isPaused = true;
  
  // Notify main thread of stop
  self.postMessage({ 
    type: 'stopped', 
    timeRemaining: timeRemaining 
  });
}
