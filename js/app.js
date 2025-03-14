// scripts/app.js

import NFCHandler from './nfc-handler.js';
import teaDB from './db.js';
import './components/tea-card.js';
import './components/tea-timer.js';
import './components/category-menu.js';

class TeaApp {
  constructor() {
    this.nfcHandler = null;
    this.teaCards = [];
    this.currentCategory = null;
    
    // Initialize the app
    this.init();
  }
  
  async init() {
    // Check for required permissions
    await this.checkNotificationPermission();
    
    // Initialize NFC handler
    this.initNFC();
    
    // Initialize UI elements
    this.initUI();
    
    // Load teas from database
    await this.loadTeas();
    
    // Load categories
    await this.loadCategories();
    
    console.log('Tea app initialized');
  }
  
  async checkNotificationPermission() {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        await Notification.requestPermission();
      }
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
    
    // Menu toggle button
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    if (menuToggleBtn) {
      menuToggleBtn.addEventListener('click', () => {
        if (this.categoryMenu) {
          // Toggle the menu open state via the web component
          this.categoryMenu.toggleMenu();
        }
      });
    }
    
    // Handle back button for detail views
    window.addEventListener('popstate', this.handlePopState.bind(this));
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
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
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
    const url = prompt('Enter the URL of a tea JSON file:');
    
    if (url) {
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
