// scripts/app.js

import NFCHandler from './nfc-handler.js';
import teaDB from './db.js';
import './components/tea-card.js';
import './components/tea-timer.js';
import './components/tea-menu.js';
import notificationService from './services/notification-service.js';
import wakeLockService from './services/wake-lock-service.js';

class TeaApp {
  constructor() {
    this.nfcHandler = null;
    this.currentCategory = null;
    this.teaFolder = 'tea/';
    this.baseUrl = this.getBaseUrl();
    
    // Initialize the app
    this.init();
  }
  
  getBaseUrl() {
    // Get the base URL without filename and query parameters
    const url = new URL(window.location.href);
    let pathname = url.pathname;
    
    // Remove index.html or other files from the path
    pathname = pathname.replace(/\/[^\/]*\.[^\/]*$/, '/');
    
    // Ensure the path ends with a slash
    if (!pathname.endsWith('/')) {
      pathname += '/';
    }
    
    return url.origin + pathname;
  }
  
  async init() {
    // Show loader while initializing
    this.showLoader();
    
    try {
      // Initialize UI elements
      this.initUI();
      
      // Register service worker
      await this.registerServiceWorker();
      
      // Initialize notification service
      await notificationService.init();
      
      // Initialize NFC handler
      this.initNFC();
      
      // Check if URL contains tea parameters
      this.checkUrlForTeaParams();
      
      // Load teas from database
      await this.loadTeas();
      
      // Load categories
      await this.loadCategories();
      
      console.log('Tea app initialized');
      this.showMessage('App ready! Scan a tea tag or browse your collection.', 'info');
    } catch (error) {
      console.error('Error initializing app:', error);
      this.showMessage('Error initializing app. Please refresh the page.', 'error');
    } finally {
      this.hideLoader();
    }
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('./service-worker.js');
        console.log('ServiceWorker registration successful:', registration.scope);
        return true;
      } catch (error) {
        console.error('ServiceWorker registration failed:', error);
        return false;
      }
    }
    return false;
  }

  initNFC() {
    this.nfcHandler = new NFCHandler(this.handleNFCRead.bind(this));
    
    // Start NFC scanner when the page loads
    if ('NDEFReader' in window) {
      this.nfcHandler.startNFCScanner()
        .then(success => {
          if (success) {
            this.showMessage('NFC scanner ready. Scan a tea tag!', 'info');
          }
        })
        .catch(error => {
          console.error('Error starting NFC scanner:', error);
        });
    } else {
      console.log('Web NFC API not supported in this browser');
    }
  }
  
  checkUrlForTeaParams() {
    // Check if the current URL has tea parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('tea')) {
      const teaFile = urlParams.get('tea');
      const teaUrl = `${this.baseUrl}${this.teaFolder}${teaFile}`;
      this.handleNFCRead(teaUrl);
      this.cleanupUrl();
    } else if (urlParams.has('teaId')) {
      const teaId = urlParams.get('teaId');
      const teaUrl = `${this.baseUrl}${this.teaFolder}${teaId}.cha`;
      this.handleNFCRead(teaUrl);
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
    
    // Button for manual JSON URL input
    const manualInputBtn = document.getElementById('manual-input-btn');
    if (manualInputBtn) {
      manualInputBtn.addEventListener('click', this.handleManualInput.bind(this));
    }
    
    // Menu toggle button
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    if (menuToggleBtn && this.categoryMenu) {
      menuToggleBtn.addEventListener('click', () => {
        this.categoryMenu.toggleMenu();
      });
    }
    
    // Handle responsive layout
    window.addEventListener('resize', this.handleResponsiveLayout.bind(this));
    this.handleResponsiveLayout();
    
    // Handle back button for detail views
    window.addEventListener('popstate', this.handlePopState.bind(this));
  }
  
  handleResponsiveLayout() {
    const isMobile = window.innerWidth < 768;
    
    // Adjust content area based on screen size
    const contentArea = document.querySelector('.content-area');
    if (contentArea) {
      contentArea.style.marginLeft = isMobile ? '0' : '200px';
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
      // Validate and fix URL if needed
      let validUrl = url;
      
      try {
        new URL(url);
      } catch (urlError) {
        validUrl = this.baseUrl + (url.startsWith('/') ? url.slice(1) : url);
        console.log('Fixed URL:', validUrl);
      }
      
      // Fetch with fallback mechanism
      const fetchWithFallback = async (primaryUrl) => {
        try {
          const response = await fetch(primaryUrl);
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          return await response.json();
        } catch (primaryError) {
          console.warn('Primary fetch failed:', primaryError);
          
          // Try local path as fallback
          const filename = primaryUrl.split('/').pop();
          const extension = filename.includes('.') ? '' : '.cha';
          const localUrl = `${this.baseUrl}${this.teaFolder}${filename}${extension}`;
          
          console.log('Trying fallback URL:', localUrl);
          
          const fallbackResponse = await fetch(localUrl);
          
          if (!fallbackResponse.ok) {
            throw new Error(`Fallback HTTP error! Status: ${fallbackResponse.status}`);
          }
          
          return await fallbackResponse.json();
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
      
      // Make sure drawer is opened
      setTimeout(() => {
        this.teaTimer.openDrawer();
      }, 100);
    }
  }
  
  handleShowDetailView(event) {
    const teaData = event.detail.tea;
    const element = event.detail.element;
    
    if (element) {
      // Add to browser history 
      history.pushState({ detailView: true, teaId: teaData.id }, '', `#tea/${teaData.id}`);
      
      // Set the detail view attribute
      element.setAttribute('detail-view', 'true');
    }
  }
  
  handlePopState(event) {
    // Handle browser back button
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
    const teaId = prompt('Enter the tea ID (e.g., 000, 010):');
    
    if (teaId) {
      const url = `${this.baseUrl}${this.teaFolder}${teaId}.cha`;
      console.log('Manual input URL:', url);
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
