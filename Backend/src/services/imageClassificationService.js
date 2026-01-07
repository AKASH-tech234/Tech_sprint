import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { pythonAIService } from './pythonAIService.js';

// Lazy-load OpenAI client to ensure env vars are loaded
let openaiClient = null;
const getOpenAIClient = () => {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openaiClient;
};

/**
 * Image Classification Service using OpenAI Vision
 * Analyzes civic issue images and provides:
 * - Category classification
 * - Confidence scores
 * - Priority assessment
 * - Department routing
 */
export const imageClassificationService = {
  /**
   * Classify civic issue from image
   * @param {string} imagePath - Path to the uploaded image
   * @returns {Object} Classification results with category, confidence, priority, department
   */
  async classifyIssueImage(imagePath) {
    try {
      console.log('\n🎯 [Classification] Starting hybrid classification pipeline...');
      
      // 🐍 PRIORITY 1: Try Python SIH AI Model (free, accurate, purpose-built)
      const isPythonAvailable = await pythonAIService.checkHealth();
      
      if (isPythonAvailable) {
        try {
          console.log('🚀 [Classification] Using Python SIH AI Model (free, 90-95% accuracy)');
          const pythonResult = await pythonAIService.classifyImage(imagePath);
          
          if (pythonResult.success && pythonResult.data.confidence >= 70) {
            console.log('✅ [Classification] Python AI succeeded with good confidence');
            return pythonResult;
          } else if (pythonResult.success) {
            console.log(`⚠️  [Classification] Python AI confidence too low (${pythonResult.data.confidence}%), trying OpenAI...`);
          }
        } catch (pythonError) {
          console.warn('⚠️  [Classification] Python AI failed, trying OpenAI...', pythonError.message);
        }
      } else {
        console.log('⚠️  [Classification] Python AI service not available, using OpenAI');
      }
      
      // 🤖 PRIORITY 2: Try OpenAI (if quota available)
      console.log('🔄 [Classification] Attempting OpenAI classification...');
      
      // Read image file (handle both local files and URLs)
      let imageBuffer;
      let base64Image;
      
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        // Download image from URL (Cloudinary)
        console.log('📥 [AI] Downloading image from URL:', imagePath);
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(imagePath);
        
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } else {
        // Read from local file system
        console.log('📁 [AI] Reading local file:', imagePath);
        imageBuffer = fs.readFileSync(imagePath);
      }
      
      base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeTypeFromBuffer(imageBuffer) || this.getMimeType(imagePath);

      const prompt = `You are an expert AI trained to identify and classify civic infrastructure issues from images. Analyze the provided image carefully and classify the issue.

CATEGORIES (choose the BEST match):
1. **pothole**: Damaged roads, cracks, holes, broken pavement, asphalt damage, road deterioration
2. **streetlight**: Broken lights, damaged poles, malfunctioning street lamps, electrical issues
3. **garbage**: Waste piles, overflowing bins, littering, dumped trash, sanitation issues
4. **water**: Leaks, waterlogging, flooding, drainage problems, burst pipes, standing water
5. **traffic**: Traffic signals not working, broken signs, faded road markings, signal malfunctions
6. **noise**: Loud machinery, construction noise, industrial noise sources
7. **safety**: Dangerous structures, broken railings, unsafe areas, hazards
8. **other**: Issues that don't fit above categories

INSTRUCTIONS:
- Look CAREFULLY at the image details
- For POTHOLES: Check for holes, cracks, damaged road surface, broken asphalt
- For STREETLIGHTS: Check for broken poles, damaged lights, electrical equipment
- For GARBAGE: Check for waste, trash piles, overflowing bins
- Provide confidence based on image clarity and issue visibility
- Set priority based on safety risk and severity

PRIORITY GUIDELINES:
- **high**: Safety hazards (deep potholes, dangerous conditions), urgent repairs needed
- **medium**: Moderate issues, should be addressed soon
- **low**: Minor issues, cosmetic problems

Return ONLY this JSON (no markdown, no extra text):
{
  "category": "exact_category_name",
  "confidence": 90,
  "priority": "high",
  "description": "Clear 2-3 sentence description of what you observe in the image",
  "department": "Responsible department name",
  "alternativeCategories": [
    {"category": "backup_option", "probability": 5},
    {"category": "third_option", "probability": 3}
  ]
}`;

      // Resize large images to optimize processing
      const optimizedImage = await this.optimizeImageForAI(imageBuffer, mimeType);
      
      console.log('🤖 [AI] Starting classification with GPT-4o...');
      
      const openai = getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${optimizedImage}`,
                  detail: "high" // Use high detail for better accuracy
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3 // Lower temperature for more consistent results
      });

      const responseText = response.choices[0].message.content;
      console.log('📝 [AI] Raw response:', responseText.substring(0, 200) + '...');
      
      // Extract JSON from response (handle markdown code blocks)
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ [AI] Failed to extract JSON from response:', responseText);
        throw new Error('Failed to parse classification response');
      }

      let classification;
      try {
        classification = JSON.parse(jsonMatch[0]);
        console.log('✅ [AI] Parsed classification:', classification);
      } catch (parseError) {
        console.error('❌ [AI] JSON parse error:', parseError.message);
        throw new Error('Invalid JSON in classification response');
      }

      // Validate category
      const validCategories = ['pothole', 'streetlight', 'garbage', 'water', 'traffic', 'noise', 'safety', 'other'];
      if (!validCategories.includes(classification.category)) {
        classification.category = 'other';
      }

      // Validate priority
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(classification.priority)) {
        classification.priority = 'medium';
      }

      // Ensure confidence is a number
      classification.confidence = parseInt(classification.confidence) || 0;

      console.log('🎉 [AI] Classification complete:', {
        category: classification.category,
        confidence: classification.confidence,
        priority: classification.priority
      });

      return {
        success: true,
        data: classification
      };

    } catch (error) {
      console.error('❌ [AI] OpenAI classification error:', {
        message: error.message,
        code: error.code,
        imagePath: imagePath
      });
      
      // 🔥 PRIORITY 3: If OpenAI fails with quota error, retry Python AI with lower threshold
      if (error.code === 'insufficient_quota' || error.message.includes('quota')) {
        console.log('💡 [Classification] OpenAI quota exceeded, using Python AI as fallback...');
        
        try {
          const pythonResult = await pythonAIService.classifyImage(imagePath);
          if (pythonResult.success) {
            console.log('✅ [Classification] Python AI fallback successful');
            return pythonResult;
          }
        } catch (fallbackError) {
          console.error('❌ [Classification] Python AI fallback also failed:', fallbackError.message);
        }
      }
      
      // 🛡️ FINAL FALLBACK: Return default classification
      console.log('⚠️  [Classification] All AI methods failed, using manual fallback');
      return {
        success: false,
        error: error.message,
        data: {
          category: 'other',
          confidence: 0,
          priority: 'medium',
          description: 'Unable to automatically classify. Please select category manually.',
          department: 'General Municipal Department',
          alternativeCategories: []
        }
      };
    }
  },

  /**
   * Optimize image for AI processing (resize if too large)
   * @param {Buffer} imageBuffer - Original image buffer
   * @param {string} mimeType - Image MIME type
   * @returns {string} Base64 encoded optimized image
   */
  async optimizeImageForAI(imageBuffer, mimeType) {
    try {
      const sharp = (await import('sharp')).default;
      
      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();
      console.log('📐 [AI] Original image size:', {
        width: metadata.width,
        height: metadata.height,
        size: `${(imageBuffer.length / 1024).toFixed(2)} KB`
      });

      // If image is larger than 2048px on any side, resize it
      const maxDimension = 2048;
      let optimizedBuffer = imageBuffer;

      if (metadata.width > maxDimension || metadata.height > maxDimension) {
        console.log('🔄 [AI] Resizing image for optimal processing...');
        optimizedBuffer = await sharp(imageBuffer)
          .resize(maxDimension, maxDimension, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 85 }) // Convert to JPEG with good quality
          .toBuffer();
        
        console.log('✅ [AI] Resized image:', {
          newSize: `${(optimizedBuffer.length / 1024).toFixed(2)} KB`,
          reduction: `${(((imageBuffer.length - optimizedBuffer.length) / imageBuffer.length) * 100).toFixed(1)}%`
        });
      }

      return optimizedBuffer.toString('base64');
    } catch (error) {
      // If sharp is not installed or fails, use original image
      console.warn('⚠️  [AI] Image optimization failed, using original:', error.message);
      return imageBuffer.toString('base64');
    }
  },

  /**
   * Batch classify multiple images
   * @param {Array<string>} imagePaths - Array of image paths
   * @returns {Object} Classification results for all images
   */
  async classifyMultipleImages(imagePaths) {
    const results = [];
    
    for (const imagePath of imagePaths) {
      const result = await this.classifyIssueImage(imagePath);
      results.push({
        imagePath,
        ...result
      });
    }

    // Determine primary category based on highest confidence
    const primaryResult = results.reduce((prev, current) => {
      return (current.data?.confidence > prev.data?.confidence) ? current : prev;
    });

    return {
      primaryClassification: primaryResult.data,
      allResults: results,
      totalImages: imagePaths.length
    };
  },

  /**
   * Get department mapping for a category
   * @param {string} category - Issue category
   * @returns {string} Department name
   */
  getDepartmentForCategory(category) {
    const departmentMap = {
      pothole: 'Public Works Department (PWD)',
      streetlight: 'Electricity Board / Municipal Corporation',
      garbage: 'Sanitation Department / Municipal Waste Management',
      water: 'Water Supply & Sewerage Department',
      traffic: 'Traffic Management Department',
      noise: 'Pollution Control Board',
      safety: 'Municipal Safety & Security Department',
      other: 'General Municipal Department'
    };

    return departmentMap[category] || departmentMap.other;
  },

  /**
   * Get MIME type from file extension
   * @param {string} filePath - Path to file
   * @returns {string} MIME type
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/jpeg';
  },

  /**
   * Get MIME type from buffer content (magic numbers)
   * @param {Buffer} buffer - Image buffer
   * @returns {string|null} MIME type or null
   */
  getMimeTypeFromBuffer(buffer) {
    // Check file signature (magic numbers)
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'image/jpeg';
    }
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'image/png';
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return 'image/gif';
    }
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      return 'image/webp';
    }
    return null;
  },

  /**
   * Validate classification result
   * @param {Object} classification - Classification result
   * @returns {boolean} Is valid
   */
  validateClassification(classification) {
    const validCategories = ['pothole', 'streetlight', 'garbage', 'water', 'traffic', 'noise', 'safety', 'other'];
    const validPriorities = ['low', 'medium', 'high'];

    return (
      classification.category &&
      validCategories.includes(classification.category) &&
      classification.confidence >= 0 &&
      classification.confidence <= 100 &&
      validPriorities.includes(classification.priority)
    );
  }
};
