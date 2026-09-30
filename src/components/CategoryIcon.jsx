"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ShoppingBag,
  Package,
  Wheat,
  Fish,
  Flame,
  Milk,
  CupSoda,
  Home,
  Sparkles,
  UtensilsCrossed,
  Coffee,
  Apple,
  Salad,
  Carrot,
  Egg,
  Beef,
  Droplets,
  Layers
} from 'lucide-react';

/**
 * Maps category attributes to a fallback Lucide React icon when no valid logo image URL is provided.
 */
function getFallbackIcon(category) {
  if (!category) return ShoppingBag;
  const en = (category.en || '').toLowerCase();
  const bn = (category.bn || '').toLowerCase();
  const group = (category.group || '').toLowerCase();

  // Rice & Grains
  if (en.includes('rice') || bn.includes('চাল') || bn.includes('পোলাও') || en.includes('flour') || bn.includes('আটা') || bn.includes('ময়দা')) {
    return Wheat;
  }
  // Lentils & Pulses
  if (en.includes('dal') || en.includes('lentil') || bn.includes('ডাল')) {
    return Package;
  }
  // Oil & Ghee
  if (en.includes('oil') || bn.includes('তেল') || en.includes('ghee') || bn.includes('ঘি')) {
    return Droplets;
  }
  // Spices & Masala
  if (group === 'spices' || en.includes('spice') || bn.includes('মসলা') || bn.includes('মরিচ') || bn.includes('হলুদ') || bn.includes('পেঁয়াজ') || bn.includes('রসুন') || bn.includes('আদা')) {
    return Flame;
  }
  // Fresh Fish / Meat / Vegetables
  if (group === 'fresh' || en.includes('fish') || bn.includes('মাছ')) {
    return Fish;
  }
  if (en.includes('meat') || bn.includes('মাংস') || bn.includes('গরু') || bn.includes('খাসি')) {
    return Beef;
  }
  if (en.includes('chicken') || bn.includes('মুরগি') || en.includes('egg') || bn.includes('ডিম')) {
    return Egg;
  }
  if (en.includes('vegetable') || bn.includes('সবজি') || bn.includes('আলু')) {
    return Carrot;
  }
  if (en.includes('fruit') || bn.includes('ফল')) {
    return Apple;
  }
  // Dairy & Breakfast
  if (group === 'breakfast' || en.includes('dairy') || en.includes('milk') || bn.includes('দুধ') || bn.includes('দুগ্ধ') || bn.includes('মাখন')) {
    return Milk;
  }
  if (en.includes('tea') || bn.includes('চা') || en.includes('coffee') || bn.includes('কফি')) {
    return Coffee;
  }
  // Drinks & Snacks
  if (group === 'drinks' || en.includes('drink') || en.includes('beverage') || bn.includes('পানীয়') || bn.includes('জুস') || bn.includes('নাস্তা')) {
    return CupSoda;
  }
  // Household
  if (group === 'household' || en.includes('house') || bn.includes('গৃহস্থালি') || bn.includes('সাবান') || bn.includes('পরিষ্কার')) {
    return Home;
  }

  return ShoppingBag;
}

export default function CategoryIcon({
  icon,
  category,
  size = 24,
  className = '',
  style = {}
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [icon]);

  // Check if icon is a valid image/logo URL
  const isImageUrl =
    typeof icon === 'string' &&
    !icon.includes('pngimg.com') &&
    (icon.startsWith('http://') ||
      icon.startsWith('https://') ||
      icon.startsWith('/') ||
      icon.startsWith('blob:') ||
      icon.startsWith('data:image'));

  if (isImageUrl && !imageError) {
    const isBlobOrData = icon.startsWith('blob:') || icon.startsWith('data:image');
    const numericSize = typeof size === 'number' ? size : parseInt(size, 10) || 48;

    if (isBlobOrData) {
      return (
        <div
          style={{
            position: 'relative',
            width: `${numericSize}px`,
            height: `${numericSize}px`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...style
          }}
          className={className}
        >
          {!imageLoaded && (
            <div
              className="cat-icon-skeleton skeleton-shimmer"
              style={{
                width: `${numericSize}px`,
                height: `${numericSize}px`,
                borderRadius: '8px'
              }}
            />
          )}
          <img
            src={icon}
            alt={category?.bn || 'Category Logo'}
            className="cat-logo-image"
            style={{
              width: `${numericSize}px`,
              height: `${numericSize}px`,
              objectFit: 'contain',
              borderRadius: '4px',
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.2s ease'
            }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        </div>
      );
    }

    return (
      <div
        style={{
          position: 'relative',
          width: `${numericSize}px`,
          height: `${numericSize}px`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style
        }}
        className={className}
      >
        {!imageLoaded && (
          <div
            className="cat-icon-skeleton skeleton-shimmer"
            style={{
              width: `${numericSize}px`,
              height: `${numericSize}px`,
              borderRadius: '8px'
            }}
          />
        )}
        <Image
          src={icon}
          alt={category?.bn || 'Category Logo'}
          width={numericSize}
          height={numericSize}
          className="cat-logo-image"
          referrerPolicy="no-referrer"
          priority
          style={{
            width: `${numericSize}px`,
            height: `${numericSize}px`,
            objectFit: 'contain',
            borderRadius: '4px',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.2s ease'
          }}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Otherwise render Lucide Icon
  const IconComponent = getFallbackIcon(category);
  return <IconComponent size={size} className={className} style={style} />;
}
