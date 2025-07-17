import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PropertyCard from '../common/PropertyCard';
import { Property } from '../../types';
import { listingService } from '../../services/listingService';
import { useToast } from '../../contexts/ToastContext';

const FeaturedProperties: React.FC = () => {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    fetchFeaturedProperties();
  }, []);

  const fetchFeaturedProperties = async () => {
    setIsLoading(true);
    try {
      // Get featured/promoted properties
      const { data } = await listingService.getAllListings(
        { 
          sortBy: 'premium',
          status: 'active'
        },
        1, // page
        6  // pageSize
      );
      
      setFeaturedProperties(data);
    } catch (error) {
      console.error('Error fetching featured properties:', error);
      showError('Error', 'Failed to load featured properties. Please try again.'); // ADDED: Error handling
      setFeaturedProperties([]); // ADDED: Clear properties on error
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="py-12 bg-neutral-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h2 className="font-heading font-bold text-2xl md:text-3xl text-accent mb-2">
                Properti Unggulan
              </h2>
              <p className="text-neutral-600">
                Temukan properti terbaik dan terbaru dari seluruh Indonesia
              </p>
            </div>
          </div>
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  if (featuredProperties.length === 0) {
    // MODIFIED: Display a message if no properties are found or an error occurred
    return (
      <section className="py-12 bg-neutral-100">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-accent mb-2">
              Properti Unggulan
            </h2>
            <p className="text-neutral-600 mb-4">
              Tidak ada properti unggulan yang tersedia saat ini.
            </p>
            <Link
              to="/jual"
              className="flex items-center justify-center text-primary font-medium mt-4 md:mt-0 hover:underline"
            >
              Lihat Semua Properti <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-neutral-100">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h2 className="font-heading font-bold text-2xl md:text-3xl text-accent mb-2">
              Properti Unggulan
            </h2>
            <p className="text-neutral-600">
              Temukan properti terbaik dan terbaru dari seluruh Indonesia
            </p>
          </div>
          <Link
            to="/jual"
            className="flex items-center text-primary font-medium mt-4 md:mt-0 hover:underline"
          >
            Lihat Semua <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProperties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;