# NASA TESS Mission Narrative
 A narrative visualization project showcasing TESS's mission and exploring Earth-like exoplanets.

<svg fill="none" viewBox="0 0 600 300" width="600" height="300" xmlns="http://www.w3.org/2000/svg">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml">
      <style>
        @keyframes hi  {
            0% { transform: rotate( 0.0deg) }
           10% { transform: rotate(14.0deg) }
           20% { transform: rotate(-8.0deg) }
           30% { transform: rotate(14.0deg) }
           40% { transform: rotate(-4.0deg) }
           50% { transform: rotate(10.0deg) }
           60% { transform: rotate( 0.0deg) }
          100% { transform: rotate( 0.0deg) }
        }

        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .container {
          background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
          background-size: 400% 400%;
          animation: gradient 15s ease infinite;

          width: 100%;
          height: 300px;

          display: flex;
          justify-content: center;
          align-items: center;
          color: white;

          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        }

        .hi {
          animation: hi 1.5s linear -0.5s infinite;
          display: inline-block;
          transform-origin: 70% 70%;
        }

        @media (prefers-reduced-motion) {
          .container {
            animation: none;
          }

          .hi {
            animation: none;
          }
        }
      </style>

      <div class="container">
        <h1>Hi there, my name is Nikola <div class="hi">👋</div></h1>
      </div>
    </div>
  </foreignObject>
</svg>


# Martini Glass Structure
## Storyline:
- Scene 1 : Overview of exoplanets discovered by TESS by years. The user can get to the next scene by clicking on a specific planet in the scatter plot.
- Scene 2 : Detailed view of the selected exoplanet's characteristics like Equilibrium Temperature and Orbital Eccentricity.
- Scene 3 : Interactive exploration scene where user can filter or search planets based on their characteristics.


### Scene1
Scene 1 offers a profound look into the timeline of the Transiting Exoplanet Survey Satellite (TESS) discoveries. It highlights the planets with characteristics similar to Earth.

<img src="references/scene1_ahmadai.png" width="450em">


### Scene2
Scene 2 provides a toolkit to delve into the attributes of individual planets. It lets you contrast the aspects of planet parameters with those of Earth.

<img src="references/scene2_ahmadai.png" width="450em">

### Scene3
Scene 3 brings an interactive dashboard that evolves the visualization based on your preferences for a tailored analytical insight.

<img src="references/scene3_ahmadai.png" width="450em">
