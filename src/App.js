import React from 'react';
import csvPath from './datagrunnlag.csv';
import CountUp from 'react-countup';
import useMouse from '@react-hook/mouse-position';

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
var one_day = 1000 * 60 * 60 * 24;

function App() {
  const [currentDisplayText, setCurrentDisplayText] = React.useState('');
  const [percetageStatus, setPercentageStatus] = React.useState('');
  const [nextLandmark, setNextLandmark] = React.useState('');
  const [tip, setTip] = React.useState(null);
  const [stickyTip, setStickyTip] = React.useState(null);
  const svgRef = React.useRef();
  const mousePosRef = React.useRef(null);
  const mouse = useMouse(mousePosRef, {
    enterDelay: 100,
    leaveDelay: 100,
  });

  const isSameDay = (date, compareDate) => {
    const currentDay = date.getDate();
    const currentMonth = date.getMonth();
    const _day = new Date(compareDate).getDate();
    const _month = new Date(compareDate).getMonth();
    console.log({ date, compareDate, currentDay, _day });

    return currentDay === _day && currentMonth === _month;
  };

  React.useEffect(() => {
    if (stickyTip) {
      setTimeout(() => {
        setStickyTip(null);
      }, 4000);
    }
  }, [stickyTip]);

  function getDaysLeftToKnowit() {
    const today = new Date();
    const vierknowit = new Date(today.getFullYear(), 1, 18);
    if (today.getMonth() > 1 && today.getDate() > 1) {
      vierknowit.setFullYear(vierknowit.getFullYear() + 1);
    }
    const timeleft = Math.ceil(
      (vierknowit.getTime() - today.getTime()) / one_day
    );

    document.title = `🌟 Vi er ett om ${timeleft} dager!`;
    setCurrentDisplayText(timeleft);
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
      const margin = { top: 50, right: 50, bottom: 100, left: 50 },
        width = parentWidth - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

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
            shortLabel: d.shortLabel,
          };
        },

        // Now I can use this dataset:
        function (data) {
          // Add X axis --> it is a date format
          var x = d3
            .scaleTime()
            .domain(
              d3.extent(data, function (d, i) {
                // if (i === 0 || i === data.length - 1) return d.date;
                return d.date;
              })
            )
            .range([0, width]);

          svg
            .append('g')
            .attr('class', 'xAxis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(
              d3.axisBottom(x).ticks(18, d3.timeFormat('%d %b'))
              // .tickValues(d3.range(0, data.length, 4))
            )
            .selectAll('svg text');
          // .each(function (d, i) {
          //   d3.select(this).text(d);
          // });

          data.forEach((_d) => {
            if (_d.label) {
            }
          });

          // Add Y axis
          var y = d3.scaleLinear().domain([0, 100]).range([height, 0]);
          svg
            .append('g')
            .call(d3.axisLeft(y))
            .attr('class', 'yAxis')
            .selectAll('svg text')
            .each(function (d) {
              d3.select(this).text(d + '%');
            });

          data.forEach((_d, i) => {
            if (_d.label && i && _d.shortLabel !== 'invisible') {
              // Linjen for label
              svg
                .append('line')
                .attr('x1', x(_d.dateMS))
                .attr('y1', 0)
                .attr('x2', x(_d.dateMS))
                .attr('y2', height)
                .attr('class', 'labelLine');
            }
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
                .curve(d3.curveNatural) // Just add that to have a curve instead of segments
                .x(function (d) {
                  return x(d.date);
                })
                .y(function (d) {
                  return y(d.value);
                })
            );

          data.forEach((_d, i) => {
            if (_d.label && _d.shortLabel !== 'invisible') {
              // Dott på krysningspunkt for label
              svg
                .append('g')
                .selectAll('dot')
                .data([_d])
                .enter()
                .append('circle')
                .attr('cx', function (d) {
                  return x(d.date);
                })
                .attr('cy', function (d) {
                  return y(d.value);
                })
                .attr('r', 0)
                .attr('stroke', '#f0f')
                .attr('stroke-width', 0)
                .attr('fill', '#f0f')
                .attr('class', data.length - 1 === i ? 'final_dot' : 'pink_dot')

                .on('mouseover', function (d) {
                  setTip(d);
                })
                .on('click', function (d) {
                  setStickyTip((s) => (s ? null : d));
                })
                .on('mouseout', function (d) {
                  setTip(null);
                });
            } else {
              svg
                .append('g')
                .selectAll('dot')
                .data([_d])
                .enter()
                .append('circle')
                .attr('cx', function (d) {
                  return x(d.date);
                })
                .attr('cy', function (d) {
                  return y(d.value);
                })
                .attr('r', 4)
                .attr('stroke', 'transparent')
                .attr('stroke-width', 4)
                .attr('fill', 'transparent')
                .on('mouseover', function (d) {
                  setTip(d);
                })
                .on('click', function (d) {
                  setStickyTip((s) => (s ? null : d));
                })
                .on('mouseout', function (d) {
                  setTip(null);
                });
            }
          });

          // Added after to appear above all lines
          data.forEach((_d) => {
            if (_d.label && _d.shortLabel && _d.shortLabel !== 'invisible') {
              // Label for label
              svg
                .append('text')
                .attr('y', y(_d.value - 4)) //magic number here
                .attr('x', x(_d.dateMS))
                .attr('opacity', 0)
                .attr('class', 'myLabel') //easy to style with CSS
                .text(_d.shortLabel);
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
              .attr('content', `${current.valueNum}`)
              .on('mouseover', function (d) {
                setTip({
                  ...d,
                  label: 'Dagens dato! 🧠',
                });
              })
              .on('click', function (d) {
                setStickyTip((s) =>
                  s
                    ? null
                    : {
                        ...d,
                        label: 'Dagens dato! 🧠',
                      }
                );
              })
              .on('mouseout', function (d) {
                setTip(null);
              });
          }

          // Animation
          const pinkDot = svg.selectAll('.pink_dot');
          pinkDot
            .transition()
            .duration(800)
            .attr('r', 4)
            .attr('stroke-width', 4)
            .delay(function (d, i) {
              console.log(i);
              return i * 300;
            });
          // Animation
          svg
            .selectAll('.final_dot')
            .transition()
            .duration(800)
            .attr('r', 12)
            .attr('stroke', 'gold')
            .attr('fill', 'gold')
            .attr('stroke-width', 8)
            .delay(function (d, i) {
              console.log(i);
              return (data.filter((f) => f.label).length - 1) * 300;
            });

          svg
            .selectAll('.myLabel')
            .transition()
            .duration(800)
            .attr('opacity', 1)
            .delay(function (d, i) {
              console.log(i);
              return (i + 0.3) * 300;
            });
          svg.selectAll('circle').attr('cursor', 'pointer');
        }
      );
    }
  }, [svgRef]);

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

  // function createData() {
  //   let data = [];
  //   let current = 0;
  //   const intervalDays = 120;
  //   const magicNum = 0.59;

  //   for (
  //     var d = new Date(2020, 9, 22);
  //     d <= new Date(2021, 1, 18);
  //     d.setDate(d.getDate() + 1)
  //   ) {
  //     const obj = {
  //       dateMS: undefined,
  //       label: undefined,
  //       value: undefined,
  //     };

  //     const day = d.getDate();
  //     const month = d.getMonth();

  //     if (month === 9) {
  //       if (day === 22)
  //         obj.label = 'Nyheten om at Knowit kjøper Creuna publiseres';
  //     } else if (month === 10) {
  //       if (day === 19) obj.label = 'Konkurransetilsynet godkjenner oppkjøpet';
  //     } else if (month === 11) {
  //       if (day === 1) obj.label = 'KXO overtar Creuna';
  //     } else if (month === 0) {
  //       if (day === 1) obj.label = 'Felles Unit 4 / UBW';
  //       else if (day === 4) obj.label = 'Vi deler lokaler på Skøyen';
  //       else if (day === 18)
  //         obj.label =
  //           'Styrene i Creuna og KXO beslutter org. struktur og felles vilkår';
  //       else if (day === 20)
  //         obj.label = 'Ombygging av felles kontor ferdigstilt';
  //     } else if (month === 1) {
  //       if (day === 1)
  //         obj.label =
  //           'Ny felles organisering for folk og fag legges frem for ansatte';
  //       else if (day === 3)
  //         obj.label = 'Felles salgspresentasjon klar for bruk';
  //       else if (day === 5)
  //         obj.label = 'Felles nettside og digitale kommunikasjonskanaler';
  //       else if (day === 18)
  //         obj.label =
  //           'Creuna og Knowit er fusjonert!! (Knowit e-post, signatur, nye arbeidskontrakter etc)';
  //     }

  //     obj.value = current;
  //     current += obj.label ? magicNum + 3 : magicNum;

  //     obj.dateMS = new Date(d).getTime();

  //     data.push(obj);
  //   }
  //   console.log(JSON.stringify(data));
  // }

  // createData();

  // const creunaOpacity = 1 - percetageStatus / 100;
  // const knowitOpacity = 0 + percetageStatus / 100;
  function getFormattedDate(date) {
    var year = date.getFullYear();
    const monthNames = [
      'Januar',
      'Februar',
      'Mars',
      'April',
      'Mai',
      'Juni',
      'Juli',
      'August',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    var month = monthNames[date.getMonth()];

    var day = date.getDate().toString();
    day = day.length > 1 ? day : '0' + day;

    return day + '. ' + month + ' ' + year;
  }

  const tipWithSticky = { ...tip, ...stickyTip };
  return (
    <div className='app-wrapper' ref={mousePosRef}>
      {tipWithSticky?.value && (
        <div
          className={'tip'}
          style={{
            top: mouse.y + 10,
            left: mouse.x + (tipWithSticky.value > 50 ? -280 : 10),
          }}
        >
          <b>
            {getFormattedDate(new Date(tipWithSticky.date))}
            {': '}
            {tipWithSticky.valueNum.toFixed(0) + ' % fusjonert'}
          </b>
          <p style={{ marginBottom: 0 }}>{tipWithSticky.label}</p>
        </div>
      )}
      <h1>
        Vi er ett om <span className={'pink'}>{currentDisplayText} dager!</span>{' '}
        🌟{' '}
      </h1>
      <h2>
        Vi er{' '}
        <b className={'pink'} style={{ fontSize: '2em' }}>
          <CountUp
            start={0}
            end={percetageStatus}
            duration={7}
            useEasing={true}
            separator=' '
            suffix=' % '
          />
        </b>
        fusjonert!
      </h2>
      <h3>
        Neste milepæl er: <span className={'pink'}>{nextLandmark}</span>
      </h3>
      {/* <div className={'merge-companies-wrapper'}>
        <motion.img
          animate={{
            left: `${percetageStatus / 2}%`,
            // opacity: creunaOpacity,
          }}
          style={{
            position: 'absolute',
          }}
          transition={{ duration: 5, ease: 'easeIn' }}
          initial={{ left: 0, opacity: 1 }}
          className={'mergeImg'}
          alt={'creuna-logo'}
          src={creunaLogo}
        />
        <motion.img
          animate={{
            right: `${percetageStatus / 2}%`,
            // opacity: knowitOpacity,
          }}
          style={{
            position: 'absolute',
          }}
          transition={{ duration: 5, ease: 'easeIn' }}
          initial={{ right: 0, opacity: 1 }}
          className={'mergeImg'}
          alt={'knowit-logo'}
          src={knowitLogo}
        />
      </div> */}

      <div ref={svgRef} id='my_dataviz' />

      <footer>
        For spørsmål angående denne løsningen, ta kontakt med{' '}
        <a href='mailto:jl.hansen@creuna.no'>Jørgen Lybeck Hansen</a>
      </footer>
    </div>
  );
}

export default App;
