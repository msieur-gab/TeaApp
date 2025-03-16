// scripts/app.js

import NFCHandler from './nfc-handler.js';
import teaDB from './db.js';
import './components/tea-card.js';
import './components/tea-timer.js';
import './components/tea-menu.js';
import notificationService from './services/notification-service.js';

class TeaApp {
  constructor() {
    this.nfcHandler = null;
    this.teaCards = [];
    this.currentCategory = null;
    this.teaFolder = 'tea/';
    this.baseUrl = this.getBaseUrl();
    
    // Initialize the app
    this.init();
  }
  
  getBaseUrl() {
    // Extract the base URL of the current page (without filename and query parameters)
    const url = window.location.href;
    const urlObj = new URL(url);
    
    // Get the origin (protocol + hostname + port)
    const origin = urlObj.origin;
    
    // Get the pathname and remove the filename part if present
    let pathname = urlObj.pathname;
    
    // Remove index.html or any other file from the path
    pathname = pathname.replace(/\/[^\/]*\.[^\/]*$/, '/');
    
    // Ensure the path ends with a slash
    if (!pathname.endsWith('/')) {
      pathname += '/';
    }
    
    return origin + pathname;
  }
  
  async init() {
    // Check for required permissions - moved to the beginning for early prompting
    await this.checkNotificationPermission();
    
    // Initialize NFC handler
    this.initNFC();
    
    // Initialize UI elements
    this.initUI();
    
    // Check if the URL contains tea parameters
    this.checkUrlForTeaParams();
    
    // Load teas from database
    await this.loadTeas();
    
    // Load categories
    await this.loadCategories();
    
    // Preload notification sounds for better responsiveness
    this.preloadNotificationSounds();
    
    console.log('Tea app initialized');
  }
  
  // Improved notification permission handling
  async checkNotificationPermission() {
    if ('Notification' in window) {
      // Log current status
      console.log('Current notification permission:', Notification.permission);
      
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        try {
          // Show a message explaining why we need notification permission
          this.showMessage('Please allow notifications for timer alerts', 'info');
          
          // Request permission
          const permission = await Notification.requestPermission();
          console.log('Notification permission response:', permission);
          
          if (permission === 'granted') {
            this.showMessage('Notifications enabled for timer alerts', 'success');
          } else {
            this.showMessage('Notifications disabled. Timer alerts may not work when app is in background.', 'warning');
          }
        } catch (error) {
          console.error('Error requesting notification permission:', error);
        }
      }
    } else {
      console.warn('Notifications not supported in this browser');
      this.showMessage('Notifications not supported in this browser. Timer functionality may be limited.', 'warning');
    }
  }
  
  // Preload sounds to improve playback reliability
  preloadNotificationSounds() {
    try {
      // Create audio elements for both formats
      const mp3Sound = new Audio('./assets/sounds/notification.mp3');
      const oggSound = new Audio('./assets/sounds/notification.ogg');
      
      // Set to preload
      mp3Sound.preload = 'auto';
      oggSound.preload = 'auto';
      
      // Try to load
      mp3Sound.load();
      oggSound.load();
      
      console.log('Notification sounds preloaded');
    } catch (error) {
      console.warn('Error preloading notification sounds:', error);
    }
  }
  
  initNFC() {
    this.nfcHandler = new NFCHandler(this.handleNFCRead.bind(this));
    
    // Start NFC scanner when the page loads
    document.addEventListener('DOMContentLoaded', async () => {
      if (await this.nfcHandler.startNFCScanner()) {
        this.showMessage('NFC scanner ready. Scan a tea tag!', 'info');
      } else {
        this.showMessage('NFC scanning is not available. Open this app on a compatible device.', 'warning');
      }
    });
  }
  
  checkUrlForTeaParams() {
    // Check if the current URL has tea parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('tea')) {
      const teaFile = urlParams.get('tea');
      const teaUrl = `${this.baseUrl}${this.teaFolder}${teaFile}`;
      
      // Process the tea file from URL
      this.handleNFCRead(teaUrl);
      
      // Clean up the URL to avoid reprocessing on refresh
      this.cleanupUrl();
    } else if (urlParams.has('teaId')) {
      const teaId = urlParams.get('teaId');
      const teaUrl = `${this.baseUrl}${this.teaFolder}${teaId}.cha`; // Update to .cha extension
      
      // Process the tea file from URL
      this.handleNFCRead(teaUrl);
      
      // Clean up the URL to avoid reprocessing on refresh
      this.cleanupUrl();
    }
  }
  
  cleanupUrl() {
    // Remove query parameters from URL to prevent reprocessing on refresh
    const currentUrl = window.location.href.split('?')[0];
    window.history.replaceState({}, document.title, currentUrl);
  }
  
  initUI() {
    // Get UI elements
    this.teaContainer = document.getElementById('tea-container');
    this.categoryMenu = document.querySelector('category-menu');
    this.teaTimer = document.querySelector('tea-timer');
    this.loader = document.getElementById('loader');
    this.messageContainer = document.getElementById('message-container');
    
    // Set up event listeners
    document.addEventListener('start-steeping', this.handleSteepingStart.bind(this));
    document.addEventListener('category-selected', this.handleCategorySelected.bind(this));
    document.addEventListener('show-detail-view', this.handleShowDetailView.bind(this));
    
    // Button for manual JSON URL input (for testing without NFC)
    const manualInputBtn = document.getElementById('manual-input-btn');
    if (manualInputBtn) {
      manualInputBtn.addEventListener('click', this.handleManualInput.bind(this));
    }
    
    // Menu toggle button - now directly interacts with the menu component
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    if (menuToggleBtn && this.categoryMenu) {
      menuToggleBtn.addEventListener('click', () => {
        this.categoryMenu.toggleMenu();
      });
    }
    
    // Handle responsive layout changes
    window.addEventListener('resize', this.handleResponsiveLayout.bind(this));
      
    // Initial layout setup
    this.handleResponsiveLayout();
    
    // Handle back button for detail views
    window.addEventListener('popstate', this.handlePopState.bind(this));
  }
  
  // Add a new method to handle responsive layout changes
  handleResponsiveLayout() {
    const isMobile = window.innerWidth < 768;
    
    // Adjust main content area margins based on screen size
    const contentArea = document.querySelector('.content-area');
    if (contentArea) {
      if (!isMobile) {
        // On desktop, give space for the menu
        contentArea.style.marginLeft = '200px';
      } else {
        // On mobile, use full width
        contentArea.style.marginLeft = '0';
      }
    }
  }
  
  async loadTeas() {
    try {
      this.showLoader();
      
      const teas = this.currentCategory 
        ? await teaDB.getTeasByCategory(this.currentCategory)
        : await teaDB.getAllTeas();
      
      this.renderTeaCards(teas);
      
      this.hideLoader();
    } catch (error) {
      console.error('Error loading teas:', error);
      this.showMessage('Failed to load tea collection', 'error');
      this.hideLoader();
    }
  }
  
  async loadCategories() {
    try {
      const categories = await teaDB.getCategories();
      
      if (this.categoryMenu) {
        this.categoryMenu.categoriesList = categories;
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }
  
  renderTeaCards(teas) {
    // Clear existing cards
    this.teaContainer.innerHTML = '';
    
    if (teas.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = this.currentCategory 
        ? `No teas found in the "${this.currentCategory}" category. Scan a new tea tag!`
        : 'Your tea collection is empty. Scan a tea tag to add your first tea!';
      
      this.teaContainer.appendChild(emptyMessage);
      return;
    }
    
    // Create and append tea cards
    teas.forEach(tea => {
      const teaCard = document.createElement('tea-card');
      teaCard.teaData = tea;
      
      this.teaContainer.appendChild(teaCard);
    });
  }
  
  async handleNFCRead(url) {
    try {
      this.showLoader();
      this.showMessage('Tea tag detected! Loading tea information...', 'info');
      
      console.log('Processing tea URL:', url);
      
      // Fetch the JSON data from the URL
      const teaData = await this.fetchTeaData(url);
      
      if (teaData) {
        // Store tea data in the database
        const teaId = await teaDB.addTea(teaData);
        
        // Check if category exists, if not add it
        if (teaData.category) {
          await teaDB.addCategory(teaData.category);
          // Refresh categories list
          await this.loadCategories();
        }
        
        // Refresh the tea list
        await this.loadTeas();
        
        this.showMessage(`Added "${teaData.name}" to your collection!`, 'success');
      }
      
      this.hideLoader();
    } catch (error) {
      console.error('Error processing NFC tag:', error);
      this.showMessage('Failed to process tea tag', 'error');
      this.hideLoader();
    }
  }
  
  async fetchTeaData(url) {
    try {
      // First, check if the URL is valid
      let validUrl = url;
      
      try {
        // Try to construct a valid URL object to validate it
        new URL(url);
      } catch (urlError) {
        // If URL is invalid, it might be a relative path or missing the protocol
        console.warn('Invalid URL format:', url);
        
        // Try to fix the URL by prepending the base URL
        validUrl = this.getBaseUrl() + (url.startsWith('/') ? url.slice(1) : url);
        console.log('Trying to fix URL:', validUrl);
      }
      
      // Handle CORS issues by adding a fallback mechanism
      const fetchWithFallback = async (primaryUrl) => {
        try {
          console.log('Fetching tea data from:', primaryUrl);
          const response = await fetch(primaryUrl);
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          return await response.json();
        } catch (primaryError) {
          console.warn('Primary fetch failed:', primaryError);
          
          // Try to extract the filename and use local path as fallback
          try {
            const filename = primaryUrl.split('/').pop();
            // Make sure we're using the correct extension for the fallback URL
            const extension = filename.includes('.') ? '' : '.cha';
            const localUrl = `${this.getBaseUrl()}${this.teaFolder}${filename}${extension}`;
            
            console.log('Trying fallback URL:', localUrl);
            
            const fallbackResponse = await fetch(localUrl);
            
            if (!fallbackResponse.ok) {
              throw new Error(`Fallback HTTP error! Status: ${fallbackResponse.status}`);
            }
            
            return await fallbackResponse.json();
          } catch (fallbackError) {
            console.error('Fallback fetch failed:', fallbackError);
            throw primaryError; // Re-throw the original error
          }
        }
      };
      
      const data = await fetchWithFallback(validUrl);
      
      // Validate required fields
      if (!data.name || !data.category) {
        throw new Error('Invalid tea data format');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching tea data:', error);
      this.showMessage('Failed to fetch tea information', 'error');
      return null;
    }
  }
  
  handleSteepingStart(event) {
    const teaData = event.detail.tea;
    
    if (this.teaTimer && teaData) {
      this.teaTimer.setTeaData(teaData);
      
      // Make sure drawer is opened after setting tea data
      // This is redundant but ensures the drawer is visible
      setTimeout(() => {
        this.teaTimer.openDrawer();
      }, 100);
    }
  }
  
  handleShowDetailView(event) {
    const teaData = event.detail.tea;
    const element = event.detail.element;
    
    if (element) {
      // Add to browser history so back button works
      history.pushState({ detailView: true, teaId: teaData.id }, '', `#tea/${teaData.id}`);
      
      // Set the detail-view attribute to true
      element.setAttribute('detail-view', 'true');
    }
  }
  
  handlePopState(event) {
    // Handle browser back button press
    const detailViewElements = document.querySelectorAll('tea-card[detail-view="true"]');
    
    detailViewElements.forEach(element => {
      element.setAttribute('detail-view', 'false');
    });
  }
  
  handleCategorySelected(event) {
    const category = event.detail.category;
    this.currentCategory = category;
    
    // Reload teas with the selected category
    this.loadTeas();
  }
  
  async handleManualInput() {
    // First, ask for the tea ID
    const teaId = prompt('Enter the tea ID (e.g., 000, 010):');
    
    if (teaId) {
      // Construct the URL with proper base URL
      const baseUrl = this.getBaseUrl();
      const url = `${baseUrl}${this.teaFolder}${teaId}.cha`;
      
      console.log('Manual input URL:', url);
      
      // Process the URL as if it was scanned
      await this.handleNFCRead(url);
    }
  }

  showLoader() {
    if (this.loader) {
      this.loader.classList.add('active');
    }
  }
  
  hideLoader() {
    if (this.loader) {
      this.loader.classList.remove('active');
    }
  }
  
  showMessage(message, type = 'info') {
    if (!this.messageContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.textContent = message;
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'message-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
      messageElement.remove();
    });
    
    messageElement.appendChild(closeButton);
    
    // Add to container
    this.messageContainer.appendChild(messageElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageElement.parentNode === this.messageContainer) {
        messageElement.remove();
      }
    }, 5000);
  }
}



// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.teaApp = new TeaApp();
});

export default TeaApp;