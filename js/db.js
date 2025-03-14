// scripts/db.js

import Dexie from 'https://cdn.jsdelivr.net/npm/dexie@3.2.3/dist/dexie.mjs';

class TeaDatabase {
  constructor() {
    this.db = new Dexie('TeaCollection');
    
    // Define database schema
    this.db.version(1).stores({
      teas: '++id, name, category, origin, *tags, [category+name]',
      categories: '++id, name'
    });
    
    this.init();
  }
  
  async init() {
    // Check if categories exist, if not add default ones
    const categoriesCount = await this.db.categories.count();
    
    if (categoriesCount === 0) {
      await this.db.categories.bulkAdd([
        { name: 'Black' },
        { name: 'Green' },
        { name: 'Oolong' },
        { name: 'White' },
        { name: 'Herbal' },
        { name: 'Pu-erh' }
      ]);
      
      console.log('Default categories added');
    }
  }
  
  async addTea(teaData) {
    try {
      // Check if we already have this tea
      const existingTea = await this.db.teas
        .where({ name: teaData.name, category: teaData.category })
        .first();
      
      if (existingTea) {
        // Update existing tea
        await this.db.teas.update(existingTea.id, teaData);
        console.log('Tea updated:', teaData.name);
        return existingTea.id;
      } else {
        // Add new tea
        const id = await this.db.teas.add(teaData);
        console.log('Tea added:', teaData.name);
        return id;
      }
    } catch (error) {
      console.error('Error adding tea:', error);
      throw error;
    }
  }
  
  async getAllTeas() {
    try {
      return await this.db.teas.toArray();
    } catch (error) {
      console.error('Error getting all teas:', error);
      return [];
    }
  }
  
  async getTeasByCategory(category) {
    try {
      return await this.db.teas.where({ category }).toArray();
    } catch (error) {
      console.error(`Error getting teas in category ${category}:`, error);
      return [];
    }
  }
  
  async getCategories() {
    try {
      return await this.db.categories.toArray();
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }
  
  async addCategory(name) {
    try {
      // Check if category already exists
      const existingCategory = await this.db.categories.where({ name }).first();
      
      if (!existingCategory) {
        await this.db.categories.add({ name });
        console.log('Category added:', name);
      }
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }
  
  async deleteCategory(id) {
    try {
      await this.db.categories.delete(id);
      console.log('Category deleted:', id);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
}

export default new TeaDatabase();
