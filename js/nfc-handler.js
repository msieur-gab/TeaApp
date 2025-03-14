// scripts/nfc-handler.js

class NFCHandler {
  constructor(onReadCallback) {
    this.onReadCallback = onReadCallback;
    this.isReading = false;
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
        
        // Pass the URL to the callback function
        if (this.onReadCallback) {
          this.onReadCallback(url);
        }
        
        break;
      }
    }
  }
}

export default NFCHandler;
