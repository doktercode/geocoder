import {serialize} from './index';

/**
 * @class Google
 */
const name = [ 'point_of_interest', 'establishment', 'natural_feature', 'airport' ];
const road = [ 'street_address', 'route', 'sublocality_level_5', 'intersection' ];
const postcode = ['postal_code'];
const city = ['locality'];
const state = ['administrative_area_level_1'];
const country = ['country'];

function isEmpty(str) {
  return (!str || 0 === str.length);
}
function anyMatchInArray(source, target) {
  return source.some(each => target.indexOf(each) >= 0);
}

function anyItemHasValue(obj, has = false) {
  const keys = Object.keys(obj);
  keys.forEach(key => {
    if (!isEmpty(obj[key])) has = true;
  });
  return has;
}

export class Google {

  options: any; 
  
  constructor(options) {
    this.options = options || {};
  }

  geolookup(address) {
    let url: string = 'https://maps.googleapis.com/maps/api/geocode/json';
    let params: any = {
      address: address,
      key: this.options.key,
      language: this.options.lang || 'en-US'
    };
    url = `${url}?${serialize(params)}`

    return fetch(url)
      .then(resp => resp.json())
      .then(json => this._handleResponse(json))
  }

  reverse(lat, lon) {
    let url: string = 'https://maps.googleapis.com/maps/api/geocode/json';
    let params: any = {
      latlng: `${lat},${lon}`,
      key: this.options.key,
      language: this.options.lang || 'en-US'
    };

    return fetch(`${url}?${serialize(params)}`)
      .then(resp => resp.json())
      .then(json => {
        return {
          source: 'Google',
          address: json['results'][0]['formatted_address'],
          raw: json
        }
      })
  }

  private _handleResponse(json) {
    let results = json.results && json.results.length ? json.results : undefined;
    if (results) {
      /*
       * @param {Array} details - address_components
       */
      const getDetails = details => {
        let parts = {
          name: '',
          road: '',
          postcode: '',
          city: '',
          state: '',
          country: ''
        };
        details.forEach(detail => {
          if (anyMatchInArray(detail.types, name)) {
            parts.name = detail.long_name;
          } else if (anyMatchInArray(detail.types, road)) {
            parts.road = detail.long_name;
          } else if (anyMatchInArray(detail.types, postcode)) {
            parts.postcode = detail.long_name;
          } else if (anyMatchInArray(detail.types, city)) {
            parts.city = detail.long_name;
          } else if (anyMatchInArray(detail.types, state)) {
            parts.state = detail.long_name;
          } else if (anyMatchInArray(detail.types, country)) {
            parts.country = detail.long_name;
          }
        });
        return parts;
      };

      let array = [];

      results.forEach(result => {
        let details = getDetails(result.address_components);
        if (anyItemHasValue(details)) {
          array.push({
            source: 'Google',
            lon: parseFloat(result.geometry.location.lng),
            lat: parseFloat(result.geometry.location.lat),
            address: {
              name: details.name,
              postalCode: details.postcode,
              road: details.road,
              city: details.city,
              state: details.state,
              country: details.country
            },
            formatted: result.formatted_address,
            raw: result
          });
        }
      });

      return array;
    } else {
      return undefined;
    }

  }

}