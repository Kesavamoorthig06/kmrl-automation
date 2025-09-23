# Crew Role Icons

This directory contains SVG icons for the six different crew roles identified in the system architecture diagram.

## Icons Available

### 1. **CleaningCrewIcon**
- **Purpose**: Represents cleaning crew members
- **Features**: Person silhouette with cleaning tools overlay
- **Usage**: For cleaning crew login and identification

### 2. **YardCrewIcon**
- **Purpose**: Represents yard crew members
- **Features**: Person silhouette with train yard elements overlay
- **Usage**: For yard crew login and identification

### 3. **TechnicalCrewIcon**
- **Purpose**: Represents technical crew members
- **Features**: Person silhouette with technical tools overlay
- **Usage**: For technical crew login and identification

### 4. **OperationalCrewIcon**
- **Purpose**: Represents operational crew members
- **Features**: Person silhouette with operational controls overlay
- **Usage**: For operational crew login and identification

### 5. **AdminIcon**
- **Purpose**: Represents administrative users
- **Features**: Person silhouette with admin crown overlay
- **Usage**: For admin login and identification

### 6. **BrandingOfficerIcon**
- **Purpose**: Represents branding officers
- **Features**: Person silhouette with branding/marketing elements overlay
- **Usage**: For branding officer login and identification

## Usage

```jsx
import { 
  CleaningCrewIcon, 
  YardCrewIcon, 
  TechnicalCrewIcon, 
  OperationalCrewIcon, 
  AdminIcon, 
  BrandingOfficerIcon 
} from '../assets/icons';

// Example usage
<CleaningCrewIcon size={32} color="#007bff" className="crew-icon" />
```

## Props

All icons accept the following props:
- `size`: Number (default: 24) - Icon size in pixels
- `color`: String (default: "#000000") - Icon color
- `className`: String (default: "") - CSS class name

## Design Notes

- All icons maintain consistent person silhouette base
- Each icon has unique overlay elements representing their specific role
- Icons are scalable SVG format for crisp rendering at any size
- Designed to match the system architecture diagram requirements
