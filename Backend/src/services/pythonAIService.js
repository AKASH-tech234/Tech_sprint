/**
 * Python AI Service Wrapper
 * Communicates with the Flask AI service for image classification
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const PYTHON_SERVICE_URL = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:5001';

class PythonAIService {
  /**
   * Check if Python AI service is available
   * @returns {Promise<boolean>}
   */
  async checkHealth() {
    try {
      const response = await fetch(`${PYTHON_SERVICE_URL}/health`, {
        method: 'GET',
        timeout: 2000
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [Python AI] Service is healthy:', data.status);
        return data.model_loaded === true;
      }
      
      return false;
    } catch (error) {
      console.warn('⚠️  [Python AI] Service not available:', error.message);
      return false;
    }
  }

  /**
   * Classify image using Python AI model
   * @param {string} imagePath - Path to image file or URL
   * @returns {Promise<Object>} Classification result
   */
  async classifyImage(imagePath) {
    try {
      console.log('🐍 [Python AI] Starting classification...');
      
      // Get image buffer
      let imageBuffer;
      let filename = 'image.jpg';
      
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        // Download from URL (Cloudinary)
        console.log('📥 [Python AI] Downloading from URL:', imagePath);
        const response = await fetch(imagePath);
        
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }
        
        imageBuffer = Buffer.from(await response.arrayBuffer());
        
        // Extract filename from URL if possible
        const urlParts = imagePath.split('/');
        const urlFilename = urlParts[urlParts.length - 1];
        if (urlFilename) {
          filename = urlFilename;
        }
      } else {
        // Read from local file
        console.log('📁 [Python AI] Reading local file:', imagePath);
        imageBuffer = fs.readFileSync(imagePath);
        
        // Use actual filename
        const pathParts = imagePath.split(/[/\\]/);
        filename = pathParts[pathParts.length - 1];
      }
      
      console.log('📤 [Python AI] Sending image to service...');
      
      // Prepare form data
      const formData = new FormData();
      formData.append('image', imageBuffer, {
        filename: filename,
        contentType: this.getMimeType(filename)
      });
      
      // Call Python service
      const startTime = Date.now();
      const response = await fetch(`${PYTHON_SERVICE_URL}/classify`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });
      
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Python service error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ [Python AI] Classification complete in ${duration}ms`);
        console.log(`   Category: ${result.data.category}`);
        console.log(`   Confidence: ${result.data.confidence}%`);
        console.log(`   Priority: ${result.data.priority}`);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ [Python AI] Classification failed:', error.message);
      throw error;
    }
  }

  /**
   * Get MIME type from filename
   * @param {string} filename
   * @returns {string}
   */
  getMimeType(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  /**
   * Get available categories
   * @returns {Promise<Object>}
   */
  async getCategories() {
    try {
      const response = await fetch(`${PYTHON_SERVICE_URL}/categories`, {
        method: 'GET'
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error('❌ [Python AI] Failed to get categories:', error.message);
      return null;
    }
  }
}

export const pythonAIService = new PythonAIService();
