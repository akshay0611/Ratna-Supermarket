import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import { Input, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from 'react';

function SimpleDialog(props) {
  const { onClose, open } = props;
  const [pincode, setPincode] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [locationError, setLocationError] = useState('');

  // Automatically get location and convert to pincode
  useEffect(() => {
    const getLocationAndPincode = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('Latitude:', latitude, 'Longitude:', longitude);
          try {
            // Fetch pincode from coordinates using a reverse geocoding API
            const apiKey = 'API_KEY';  // Use your API Key from https://opencagedata.com/
            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`
            );
            const data = await response.json();
            const locationPincode = data.results[0].components.postcode;
            setPincode(locationPincode);
            localStorage.setItem('userPincode', locationPincode);
          } catch (error) {
            console.error('Error fetching pincode:', error);
            setLocationError('Failed to retrieve location pincode.');
          }
        }, () => {
          setLocationError('Location access denied. Please enter manually.');
        });
      } else {
        setLocationError('Geolocation is not supported by this browser.');
      }
    };
    getLocationAndPincode();
  }, []);

  const handleClose = () => {
    if (pincode.length === 6 && localStorage.getItem('userArea')) {
      onClose();
    } else {
      alert("Please enter a valid pincode & select an area from the list.");
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        if (pincode.length === 6) {
          const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
          const data = await response.json();

          if (data[0]?.Status === 'Success') {
            const areaSuggestions = data[0]?.PostOffice?.map((office) => office.Name) || [];
            setSuggestions(areaSuggestions);
          } else {
            setSuggestions([]);
          }
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [pincode]);

  const handleListItemClick = (value) => {
    onClose(value);
  };

  const handleInputChange = (e) => {
    setPincode(e.target.value);
  };

  return (
    <>
      <Dialog onClose={handleClose} open={open}   >
        <DialogTitle>
          Enter your Pincode
          <IconButton
            aria-label="close"
            onClick={handleClose}
            style={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <div className="p-6">
          {locationError && <p>{locationError}</p>}
          <form
            action="/"
            onSubmit={(e) => {
              e.preventDefault();
              localStorage.setItem('userPincode', pincode);
              setPincode('');
              handleClose();
            }}
          >
            <Input
              type="text"
              placeholder="Enter your Pincode"
              value={pincode}
              onChange={handleInputChange}
              className="mb-3"
            />

            <Button variant="contained" color="primary" type="submit">
              Submit
            </Button>
          </form>

          <div>
            <ul className="absolute z-50 p-1 bg-white w-10/12 shadow-lg">
              {suggestions.map((suggestion, index) => (
                <>
                  <button
                    key={index}
                    onClick={(e) => {
                      localStorage.setItem('userArea', suggestion);
                      localStorage.setItem('userPincode', pincode);
                      setSuggestions([]);
                    }}
                  >
                    {suggestion}
                  </button>
                  <br />
                </>
              ))}
            </ul>
          </div>
        </div>
      </Dialog>
    </>
  );
}

export default SimpleDialog;
