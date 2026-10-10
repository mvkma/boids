export const presets = {
    "default": {
        "controllers": {},
        "folders": {
            "visual": {
                "controllers": {
                    "fov": 75,
                    "timeScale": 0.5,
                    "axesHelper": false,
                    "fogDensity": 0.02,
                    "fogColor": "#241f31",
                    "rotate": true,
                    "paused": false
                },
                "folders": {}
            },
            "water": {
                "controllers": {
                    "distortionScale": 1,
                    "size": 10
                },
                "folders": {}
            },
            "sky": {
                "controllers": {
                    "turbidity": 1,
                    "rayleigh": 4,
                    "mieCoefficient": 0.005,
                    "mieDirectionalG": 0.9,
                    "cloudCoverage": 0.2,
                    "cloudDensity": 0.7,
                    "cloudElevation": 0.5
                },
                "folders": {}
            },
            "simulation": {
                "controllers": {
                    "numBoids": 500,
                    "weightSep": 0.002,
                    "weightCoh": 0.008,
                    "weightAli": 0.06,
                    "weightMag": 0.00001,
                    "maxVelocity": 0.005,
                    "radiusSep": 0.01,
                    "radiusCoh": 0.05,
                    "radiusAli": 0.05,
                    "numMag": 3,
                    "boxSizeMag": 1
                },
                "folders": {}
            }
        }
    },
    "one (night)": {
        "controllers": {},
        "folders": {
            "visual": {
                "controllers": {
                    "fov": 75,
                    "timeScale": 0.5,
                    "axesHelper": false,
                    "fogDensity": 0.008,
                    "fogColor": "#241f31",
                    "rotate": true,
                    "paused": false
                },
                "folders": {}
            },
            "water": {
                "controllers": {
                    "distortionScale": 1,
                    "size": 10
                },
                "folders": {}
            },
            "sky": {
                "controllers": {
                    "turbidity": 1,
                    "rayleigh": 0.01,
                    "mieCoefficient": 0.005,
                    "mieDirectionalG": 0.9,
                    "cloudCoverage": 0.2,
                    "cloudDensity": 0.29,
                    "cloudElevation": 0.988
                },
                "folders": {}
            },
            "simulation": {
                "controllers": {
                    "numBoids": 1500,
                    "weightSep": 0.0002,
                    "weightCoh": 0.008,
                    "weightAli": 0.06,
                    "weightMag": 0.0001,
                    "maxVelocity": 0.005,
                    "radiusSep": 0.1,
                    "radiusCoh": 0.1,
                    "radiusAli": 0.015,
                    "numMag": 3,
                    "boxSizeMag": 3
                },
                "folders": {}
            }
        }
    },
    "two": {
        "controllers": {},
        "folders": {
            "visual": {
                "controllers": {
                    "fov": 75,
                    "timeScale": 0.5,
                    "axesHelper": false,
                    "fogDensity": 0.02,
                    "fogColor": "#241f31",
                    "rotate": true,
                    "paused": false
                },
                "folders": {}
            },
            "water": {
                "controllers": {
                    "distortionScale": 1,
                    "size": 10
                },
                "folders": {}
            },
            "sky": {
                "controllers": {
                    "turbidity": 4.46,
                    "rayleigh": 0.44,
                    "mieCoefficient": 0.085,
                    "mieDirectionalG": 0.945,
                    "cloudCoverage": 0.2,
                    "cloudDensity": 0.7,
                    "cloudElevation": 0.5
                },
                "folders": {}
            },
            "simulation": {
                "controllers": {
                    "numBoids": 1000,
                    "weightSep": 0.002,
                    "weightCoh": 0.008,
                    "weightAli": 0.06,
                    "weightMag": 0.00001,
                    "maxVelocity": 0.005,
                    "radiusSep": 0.01,
                    "radiusCoh": 0.05,
                    "radiusAli": 0.05,
                    "numMag": 3,
                    "boxSizeMag": 1
                },
                "folders": {}
            }
        }
    }
};
