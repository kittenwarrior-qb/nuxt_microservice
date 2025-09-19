const axios = require('axios');

module.exports = {
  name: "location",
  
  settings: {
    // API endpoints
    provincesApiUrl: 'https://provinces.open-api.vn/api/v2',
    nominatimUrl: 'https://nominatim.openstreetmap.org',
    // Cache settings
    cacheTimeout: 1000 * 60 * 60 * 24 // 24 hours
  },
  
  // Cache for wards data
  cache: {
    allWards: null,
    allWardsTimestamp: null
  },
  
  actions: {
    /**
     * Get all provinces from provinces.open-api.vn
     */
    getProvinces: {
      rest: "GET /provinces",
      async handler(ctx) {
        try {
          const response = await axios.get(`${this.settings.provincesApiUrl}/p/`);
          
          return {
            success: true,
            data: response.data
          };
        } catch (error) {
          this.logger.error('Error fetching provinces:', error);
          return {
            success: false,
            error: 'Failed to fetch provinces',
            data: []
          };
        }
      }
    },
    
    /**
     * Get specific province by code
     */
    getProvince: {
      rest: "GET /provinces/:code",
      params: {
        code: "string"
      },
      async handler(ctx) {
        const { code } = ctx.params;
        
        try {
          const response = await axios.get(`${this.settings.provincesApiUrl}/p/${code}`);
          
          return {
            success: true,
            data: response.data
          };
        } catch (error) {
          this.logger.error('Error fetching province:', error);
          return {
            success: false,
            error: 'Failed to fetch province',
            data: null
          };
        }
      }
    },
    
    /**
     * Get all wards
     */
    getWards: {
      rest: "GET /wards",
      async handler(ctx) {
        try {
          const response = await axios.get(`${this.settings.provincesApiUrl}/w/`);
          
          return {
            success: true,
            data: response.data
          };
        } catch (error) {
          this.logger.error('Error fetching wards:', error);
          return {
            success: false,
            error: 'Failed to fetch wards',
            data: []
          };
        }
      }
    },
    
    /**
     * Get wards by province code
     */
    getWardsByProvince: {
      rest: "GET /wards/:provinceCode",
      params: {
        provinceCode: "string",
        type: { type: "string", optional: true } // Filter by division_type if needed
      },
      async handler(ctx) {
        const { provinceCode, type } = ctx.params;
        
        try {
          let wards = [];
          
          try {
            const provinceResponse = await axios.get(`${this.settings.provincesApiUrl}/p/${provinceCode}?depth=2`);
            if (provinceResponse.data && provinceResponse.data.wards && provinceResponse.data.wards.length > 0) {
              wards = provinceResponse.data.wards;
            }
          } catch (provinceError) {
            this.logger.warn('Failed to get province with depth=2, trying alternative method');
          }
          
          // Method 2: If no wards from province API, get all wards and filter by province_code
          if (wards.length === 0) {
            // Check cache first
            const now = Date.now();
            if (this.cache.allWards && this.cache.allWardsTimestamp && 
                (now - this.cache.allWardsTimestamp) < this.settings.cacheTimeout) {
              // Use cached data
              wards = this.cache.allWards.filter(ward => 
                ward.province_code && ward.province_code.toString() === provinceCode.toString()
              );
            } else {
              // Fetch fresh data
              const allWardsResponse = await axios.get(`${this.settings.provincesApiUrl}/w/`);
              if (allWardsResponse.data && Array.isArray(allWardsResponse.data)) {
                // Update cache
                this.cache.allWards = allWardsResponse.data;
                this.cache.allWardsTimestamp = now;
                
                wards = allWardsResponse.data.filter(ward => 
                  ward.province_code && ward.province_code.toString() === provinceCode.toString()
                );
              }
            }
          }
          
          // Filter by division_type if specified
          if (type && wards.length > 0) {
            wards = wards.filter(ward => ward.division_type === type);
          }
          
          return {
            success: true,
            data: wards,
            total: wards.length
          };
        } catch (error) {
          this.logger.error('Error fetching wards by province:', error);
          return {
            success: false,
            error: 'Failed to fetch wards',
            data: []
          };
        }
      }
    },
    
    /**
     * Get specific ward by code
     */
    getWard: {
      rest: "GET /ward/:code",
      params: {
        code: "string"
      },
      async handler(ctx) {
        const { code } = ctx.params;
        
        try {
          const response = await axios.get(`${this.settings.provincesApiUrl}/w/${code}`);
          
          return {
            success: true,
            data: response.data
          };
        } catch (error) {
          this.logger.error('Error fetching ward:', error);
          return {
            success: false,
            error: 'Failed to fetch ward',
            data: null
          };
        }
      }
    },
    
    /**
     * Clear cache
     */
    clearCache: {
      rest: "POST /cache/clear",
      handler(ctx) {
        this.cache.allWards = null;
        this.cache.allWardsTimestamp = null;
        
        return {
          success: true,
          message: 'Cache cleared successfully'
        };
      }
    },
    
    /**
     * Search address using Nominatim API with debounce support
     */
    searchAddress: {
      rest: "GET /search",
      params: {
        q: "string"
      },
      async handler(ctx) {
        const { q } = ctx.params;
        
        if (!q || q.trim().length < 2) {
          return {
            success: true,
            data: []
          };
        }
        
        try {
          const response = await axios.get(`${this.settings.nominatimUrl}/search`, {
            params: {
              q: q,
              format: 'json',
              addressdetails: 1,
              limit: 5,
              countrycodes: 'vn'
            },
            headers: {
              'User-Agent': 'TheGioiDiDong/1.0'
            }
          });
          
          const results = response.data.map(item => ({
            value: item.display_name,
            lat: item.lat,
            lon: item.lon,
            address: this.parseAddressComponents(item.address)
          }));
          
          return {
            success: true,
            data: results
          };
        } catch (error) {
          this.logger.error('Error searching address:', error);
          return {
            success: false,
            error: 'Failed to search address',
            data: []
          };
        }
      }
    },
    
    /**
     * Reverse geocoding - get place by coordinates
     */
    reverseGeocode: {
      rest: "GET /reverse",
      params: {
        lat: "string",
        lon: "string"
      },
      async handler(ctx) {
        const { lat, lon } = ctx.params;
        
        try {
          const response = await axios.get(`${this.settings.nominatimUrl}/reverse`, {
            params: {
              lat: lat,
              lon: lon,
              format: 'json',
              addressdetails: 1,
              'accept-language': 'vi'
            },
            headers: {
              'User-Agent': 'TheGioiDiDong/1.0'
            }
          });
          
          return {
            success: true,
            data: {
              ...response.data,
              address: this.parseAddressComponents(response.data.address)
            }
          };
        } catch (error) {
          this.logger.error('Error reverse geocoding:', error);
          return {
            success: false,
            error: 'Failed to get place details'
          };
        }
      }
    },
    
    /**
     * Get location suggestions for Vietnam
     */
    getSuggestions: {
      rest: "GET /suggestions",
      params: {
        q: { type: "string", optional: true }
      },
      handler(ctx) {
        const { q } = ctx.params;
        
        let suggestions = [
          "Thành phố Hồ Chí Minh",
          "Hà Nội",
          "Đà Nẵng",
          "Cần Thơ",
          "Hải Phòng",
          "Biên Hòa, Đồng Nai",
          "Nha Trang, Khánh Hòa",
          "Huế, Thừa Thiên Huế",
          "Buôn Ma Thuột, Đắk Lắk",
          "Quy Nhơn, Bình Định"
        ];
        
        if (q && q.trim()) {
          const query = q.toLowerCase().trim();
          suggestions = suggestions.filter(suggestion => 
            suggestion.toLowerCase().includes(query)
          );
        }
        
        return {
          success: true,
          data: suggestions.slice(0, 10)
        };
      }
    }
  },
  
  methods: {
    /**
     * Parse address components from Nominatim response
     */
    parseAddressComponents(components) {
      if (!components) return {};
      
      return {
        street: components.road || "",
        ward: components.suburb || components.village || "",
        district: components.county || components.city_district || "",
        province: components.state || "",
        country: components.country || "Vietnam"
      };
    }
  },
  
  started() {
    this.logger.info("Location service started");
    this.logger.info(`Using provinces API: ${this.settings.provincesApiUrl}`);
    this.logger.info(`Using Nominatim API: ${this.settings.nominatimUrl}`);
    this.logger.info(`Cache timeout: ${this.settings.cacheTimeout / 1000 / 60} minutes`);
  }
};
