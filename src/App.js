import React from 'react';
import csvPath from './datagrunnlag.csv';
import creunaLogo from './assets/creuna.png';
import knowitLogo from './assets/knowit-experience.png';

const d3 = window.d3;

/**
Snart helg snart begynner tirsdag 1200                                        - 10.3596491228069
Snart helg (25%) begynner 0600 på onsdag                                      - 25.6754385964901
(Mer helg enn ikke helg (50%) begynner torsdag 2300 - kun til graf?)
Det er helg!/Peak helg begynner fredag 1500
 */

// const weekdayMap = {
//   0: "Søndag",
//   1: "Mandag",
//   2: "Tirsdag",
//   3: "Onsdag",
//   4: "Torsdag",
//   5: "Fredag",
//   6: "Lørdag",
// }

function App() {
  const [currentDisplayText, setCurrentDisplayText] = React.useState('');
  const [percetageStatus, setPercentageStatus] = React.useState('');
  const [nextLandmark, setNextLandmark] = React.useState('');
  const svgRef = React.useRef();

  const isSameDay = (date, compareDate) => {
    const currentDay = date.getDate();
    const _day = new Date(compareDate).getDate();

    return currentDay === _day;
  };

  function getDaysLeftToKnowit() {
    const today = new Date();
    const vierknowit = new Date(today.getFullYear(), 1, 1);
    if (today.getMonth() > 1 && today.getDate() > 1) {
      vierknowit.setFullYear(vierknowit.getFullYear() + 1);
    }
    var one_day = 1000 * 60 * 60 * 24;
    const timeleft = Math.ceil(
      (vierknowit.getTime() - today.getTime()) / one_day
    );

    document.title = `🌟 Vi er Knowit om ${timeleft} dager!`;
    setCurrentDisplayText(`Vi er Knowit om ${timeleft} dager! 🌟 `);
  }

  React.useEffect(() => {
    getDaysLeftToKnowit();
    const svgParent = svgRef.current;

    while (svgParent && svgParent.firstChild) {
      svgParent.removeChild(svgParent.firstChild);
    }

    if (svgParent) {
      const parentWidth = svgParent.offsetWidth;
      // set the dimensions and margins of the graph
      const margin = { top: 50, right: 100, bottom: 50, left: 70 },
        width = parentWidth - margin.left - margin.right,
        height = 800 - margin.top - margin.bottom;

      // append the svg object to the body of the page
      var svg = d3
        .select('#my_dataviz')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      //Read the data
      d3.csv(
        csvPath,

        // When reading the csv, I must format variables:
        function (d) {
          return {
            date: d3.timeParse('%Q')(d.dateMS),
            value: d.value,
            valueNum: Number(d.value),
            dateMS: d.dateMS,
            label: d.label,
          };
        },

        // Now I can use this dataset:
        function (data) {
          // Add X axis --> it is a date format
          var x = d3
            .scaleTime()
            .domain(
              d3.extent(data, function (d) {
                return d.date;
              })
            )
            .range([0, width]);
          svg
            .append('g')
            .attr('transform', 'translate(0,' + height + ')')
            .call(d3.axisBottom(x))
            .selectAll('svg text')
            .each(function (d) {
              console.log(d.getTime());
              if (d.getTime() === 1612134000000) {
                d3.select(this).text('Vi er Knowit!');
              }
            });

          // Add Y axis
          var y = d3.scaleLinear().domain([0, 100]).range([height, 0]);
          svg
            .append('g')
            .call(d3.axisLeft(y))
            .selectAll('svg text')
            .each(function (d) {
              d3.select(this).text(d + '%');
            });

          // Add the line
          svg
            .append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('class', 'centerLine')
            .attr(
              'd',
              d3
                .line()
                .curve(d3.curveBasis) // Just add that to have a curve instead of segments
                .x(function (d) {
                  return x(d.date);
                })
                .y(function (d) {
                  return y(d.value);
                })
            );

          data.forEach((_d) => {
            if (_d.label) {
              // Linjen for label
              svg
                .append('line')
                .attr('x1', x(_d.dateMS))
                .attr('y1', 0)
                .attr('x2', x(_d.dateMS))
                .attr('y2', height)
                .attr('class', 'labelLine');

              // Dott på krysningspunkt for label
              svg
                .append('g')
                .selectAll('dot')
                .data([_d])
                .enter()
                .append('circle')
                .attr('class', 'marker')
                .attr('cx', function (d) {
                  return x(d.date);
                })
                .attr('cy', function (d) {
                  return y(d.value);
                })
                .attr('r', 4)
                .attr('stroke', 'pink')
                .attr('stroke-width', 3)
                .attr('fill', 'white');
            }
          });

          // Added after to appear above all lines
          data.forEach((_d) => {
            if (_d.label) {
              // Label for label
              svg
                .append('text')
                .attr('y', y(_d.value - 3)) //magic number here
                .attr('x', x(_d.dateMS))
                .attr('class', 'myLabel') //easy to style with CSS
                .text(_d.label);
            }
          });

          let current;
          const currentDate = new Date();

          let _nextLandmark;
          data.forEach((point, i) => {
            if (point.label) {
              const now = new Date();

              if (now.getTime() < Number(point.dateMS)) {
                if (!_nextLandmark || _nextLandmark.dateMS < point.dateMS) {
                  _nextLandmark = point.label;
                }
              }
            }
            // Sett tekst

            if (isSameDay(currentDate, point.date)) {
              current = point;
              setPercentageStatus(point.valueNum.toFixed(0));
            }
          });
          setNextLandmark(_nextLandmark);

          if (current) {
            console.log(current);
            svg
              .append('g')
              .selectAll('dot')
              .data([current])
              .enter()
              .append('circle')
              .attr('class', 'currentTimeCircle')
              .attr('cx', function (d) {
                return x(d.date);
              })
              .attr('cy', function (d) {
                return y(d.value);
              })
              .attr('r', 8)
              .attr('stroke', '#69b3a2')
              .attr('stroke-width', 3)
              .attr('fill', 'white')
              .attr('content', `${current.valueNum}`);
          }
        }
      );
    }
  }, [svgRef]);

  // function getDates() {
  //   let list = [];
  //   for (let i = 1; i < 31; i++) {
  //     list.push(new Date('01/' + i + '/2021').getTime());
  //   }
  //   console.log(list);
  // }

  // function getInterval() {
  //   let list = [];
  //   let magicNum = 1.639;
  //   let current = 0;

  //   for (let i = 1; i < 62; i++) {
  //     list.push(current);
  //     current += magicNum;
  //   }
  //   console.log(list);
  // }

  return (
    <div className='app-wrapper'>
      <h1>{currentDisplayText}</h1>

      <h2>
        Vi er <b style={{ fontSize: '2em' }}>{percetageStatus}%</b> merget!
      </h2>
      <h3>Neste milepæl er: {nextLandmark}</h3>
      <div className={'merge-companies-wrapper'}>
        <img
          style={{ opacity: percetageStatus / 100 }}
          alt={'creuna-logo'}
          src={creunaLogo}
        />
        {percetageStatus >= 100 ? (
          <div>
            <img
              className={'mergeImg'}
              style={{ left: `calc(${percetageStatus}% / 3 )` }}
              alt={'creuna-logo'}
              src={creunaLogo}
            />
            <img
              className={'mergeImg'}
              style={{ right: `calc(${percetageStatus}% / 3 )` }}
              alt={'knowit-logo'}
              src={knowitLogo}
            />
          </div>
        ) : (
          <>
            <img
              className={'mergeImg'}
              style={{ left: `calc(${percetageStatus}% / 3 )` }}
              alt={'creuna-logo'}
              src={creunaLogo}
            />
            <img
              className={'mergeImg'}
              style={{ right: `calc(${percetageStatus}% / 3 )` }}
              alt={'knowit-logo'}
              src={knowitLogo}
            />
          </>
        )}

        <img
          style={{ opacity: percetageStatus / 100 }}
          alt={'knowit-logo'}
          src={knowitLogo}
        />
      </div>

      <div ref={svgRef} id='my_dataviz' />

      <footer>
        Du kan bli med å utvide prosjektet! Ta kontakt med{' '}
        <a href='mailto:jl.hansen@creuna.no'>Jørgen Lybeck Hansen</a>
      </footer>
    </div>
  );
}

export default App;
