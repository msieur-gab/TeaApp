// scripts/nfc-handler.js

class NFCHandler {
  constructor(onReadCallback) {
    this.onReadCallback = onReadCallback;
    this.isReading = false;
    this.baseUrl = 'https://msieur-gab.github.io/TeaApp/';
    this.teaFolder = 'tea/';
  }

  async startNFCScanner() {
    if (!('NDEFReader' in window)) {
      console.error('Web NFC API is not supported in this browser');
      return false;
    }

    try {
      this.reader = new NDEFReader();
      await this.reader.scan();
      
      this.reader.onreading = ({ message }) => {
        this.handleNFCReading(message);
      };

      this.reader.onreadingerror = () => {
        console.error('Error reading NFC tag');
      };

      this.isReading = true;
      console.log('NFC scanner started');
      return true;
    } catch (error) {
      console.error('Error starting NFC scanner:', error);
      return false;
    }
  }

  stopNFCScanner() {
    if (this.reader) {
      this.reader.onreading = null;
      this.reader.onreadingerror = null;
      this.isReading = false;
      console.log('NFC scanner stopped');
    }
  }

  handleNFCReading(message) {
    // Process the NDEF message
    for (const record of message.records) {
      if (record.recordType === "url") {
        // Convert the payload to a string
        const textDecoder = new TextDecoder();
        const url = textDecoder.decode(record.data);
        
        console.log('NFC tag URL:', url);
        
        // Process the URL to get the tea JSON file
        const teaUrl = this.processNfcUrl(url);
        
        // If a valid tea URL was found, pass it to the callback
        if (teaUrl) {
          if (this.onReadCallback) {
            this.onReadCallback(teaUrl);
          }
        }
        
        break;
      }
    }
  }
  
  processNfcUrl(url) {
    try {
      // Create a URL object to parse the URL
      const parsedUrl = new URL(url);
      
      // Option 1: Handle URL with query parameter format (/?tea=000.cha)
      if (parsedUrl.searchParams.has('tea')) {
        const teaFile = parsedUrl.searchParams.get('tea');
        return `${this.baseUrl}${this.teaFolder}${teaFile}`;
      }
      
      // Option 2: Handle URL with query parameter format (/?teaId=000)
      if (parsedUrl.searchParams.has('teaId')) {
        const teaId = parsedUrl.searchParams.get('teaId');
        return `${this.baseUrl}${this.teaFolder}${teaId}.cha`;
      }
      
      // Option 3: Handle direct path to JSON file (/tea/000.cha)
      if (url.includes('/tea/') && url.endsWith('.cha')) {
        // URL already points directly to the JSON file
        return url;
      }
      
      // Option 4: Handle just an ID in the NFC tag
      // This assumes the NFC tag contains just a number like "000" or "010"
      if (/^\d+$/.test(url.trim())) {
        const teaId = url.trim();
        return `${this.baseUrl}${this.teaFolder}${teaId}.cha`;
      }
      
      // If none of the above formats match, return the original URL
      // The app will attempt to fetch it and handle any errors
      console.log('Using original URL:', url);
      return url;
      
    } catch (error) {
      console.error('Error processing NFC URL:', error);
      // If there's an error parsing the URL, just return the original
      return url;
    }
  }
}

export default NFCHandler;
