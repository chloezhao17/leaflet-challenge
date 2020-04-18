// dataset: past 7 days - M4.5+ earthquake

var url =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

d3.json(url, function (data) {
  console.log(data);
  createFeatures(data.features);
});

function markerSize(magnitute) {
  return magnitute * 10000;
}

function createFeatures(earthquakeData) {
  // Define a function we want to run once for each feature in the features array
  // Give each feature a popup describing the place and time of the earthquake
  function onEachFeature(feature, layer) {
    layer.bindPopup(
      "<h3>" +
        feature.properties.place +
        "</h3><hr><p>" +
        new Date(feature.properties.time) +
        feature.properties.mag +
        "</p>"
    );
  }
  // Create a GeoJSON layer containing the features array on the earthquakeData object
  // Run the onEachFeature function once for each piece of data in the array
  var earthquakes = L.geoJSON(earthquakeData, {
    onEachFeature: onEachFeature,
    pointToLayer: (data, latlng) => {
      // data refers to the feature in the dataset
      var color;
      switch (true) {
        case data.properties.mag > 4:
          color = "#f20a0a";
          break;
        case data.properties.mag > 3:
          color = "#fa6a00";
          break;
        case data.properties.mag > 2:
          color = "#fd9f00";
          break;
        case data.properties.mag > 1:
          color = "#fcce36";
          break;
        default:
          color = "#fafa6e";
          break;
      }
      return L.circle(latlng, {
        stroke: false,
        fillOpacity: 0.75,
        color: color,
        fillColor: color,
        radius: markerSize(data.properties.mag),
      });
    },
  });
  // Sending our earthquakes layer to the createMap function
  createMap(earthquakes);
}

function createMap(earthquakes) {
  // Define streetmap and darkmap layers
  var streetmap = L.tileLayer(
    "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}",
    {
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      id: "mapbox.streets",
      accessToken: API_KEY,
    }
  );

  var lightmap = L.tileLayer(
    "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}",
    {
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      id: "mapbox.light",
      accessToken: API_KEY,
    }
  );

  var satellitStreetsemap = L.tileLayer(
    "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}",
    {
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      id: "mapbox.streets-satellite",
      accessToken: API_KEY,
    }
  );

  // Define a baseMaps object to hold our base layers
  var baseMaps = {
    "Street Map": streetmap,
    "Light Map": lightmap,
    "Satellite Streets Map": satelliteStreetsmap,
  };

  // Create layer group to hold additional map layers
  var tectonicPlates = L.layerGroup();

  // Create overlay object to hold our overlay layer
  var overlayMaps = {
    Earthquakes: earthquakes,
    "Fault Lines": tectonicPlates,
  };

  d3.json("./static/data/data.json", (data) => {
    var faultLines = L.geoJSON(data, {
      style: {
        fillOpacity: 0,
        weight: 3,
        color: "orange",
      },
    });
    tectonicPlates.addLayer(faultLines);
  });

  // Create our map, giving it the streetmap and earthquakes layers to display on load
  var myMap = L.map("map", {
    center: [37.09, -95.71],
    zoom: 5,
    layers: [streetmap, earthquakes],
  });

  // Create a layer control
  // Pass in our baseMaps and overlayMaps
  // Add the layer control to the map
  L.control
    .layers(baseMaps, overlayMaps, {
      collapsed: false,
    })
    .addTo(myMap);

  // Set up the legend
  var legend = L.control({ position: "bottomright" });
  legend.onAdd = function () {
    var div = L.DomUtil.create("div", "info legend");
    var limits = [1, 2, 3, 4, 5];
    var colors = ["#fafa6e", "#fcce36", "#fd9f00", "#fa6a00", "#f20a0a"];
    var labels = [];

    // Add min & max
    var legendInfo = "<h1>Magnitude</h1>";

    div.innerHTML = legendInfo;

    limits.forEach(function (limit, index) {
      if (index == 0) {
        label = "0-1";
      } else if (index == 4) {
        label = "4+";
      } else {
        label = limits[index - 1] + "-" + limits[index];
      }
      labels.push(
        '<li style="background-color: ' + colors[index] + '">' + label + "</li>"
      );
    });

    div.innerHTML += "<ul>" + labels.join("") + "</ul>";
    return div;
  };

  // Adding legend to the map
  legend.addTo(myMap);
}
