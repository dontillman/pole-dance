// Copyright 2022, J. Donald Tillman, all rights reserved.
//
// Pole Dancing JavaScript Demo

import React, { useRef, useReducer } from 'react';
import styled from 'styled-components';
import findRoots from 'durand-kerner';  // https://github.com/scijs/durand-kerner
import {PolePlot} from './pole-plot';
import {Slider} from './slider';

function PoleDance() {
    const [ , clear] = useReducer(i => i + 1, 0);
    const polePlotRef = useRef();
    
    // feedback is [s^0 feedback, s^1 feedback, feedback to both s^0 and s^N]
    const state = {realPoles: [],
                   feedback: [0.0, 0.0, 0.0],
                   lastFeedback: 0,
                   cache: {}};
    
    const update = () => {
        const {realPoles, feedback, lastFeedback, cache} = state;
        // poly from poles
        const poly = realPoles
              .reduce((r, p) => polyMultiply([-p, 1], r),
                      [1]);
        // add feedback
        // polarity note: adding positive feedback subtracts from polynomial
        poly[0] -= feedback[0];
        let roots = [];
        if (1 < poly.length) {
            poly[1] -= feedback[1];
            // feedback to both ends
            poly[0] -= feedback[2];
            poly[poly.length - 1] -= feedback[2];
            roots = polyRoots(poly);
        }
        
        // add it to the cache
        const key = feedback[lastFeedback].toFixed(3);
        if (!(key in cache)) {
            cache[key] = roots;
        }
        polePlotRef.current.setPoles(roots,
                                     Object.values(cache),
                                     poly);
    };

    const addPole = val => {
        state.realPoles.push(val);
        update();
    };
    
    const setFeedback = (which, val) => {
        if (which !== state.lastFeedback) {
            state.cache = {};
            state.lastFeedback = which;
        }
        state.feedback[which] = val;
        update();
    };

    const width = 720;

    return (
        <AppDiv>
            <PolePlot width={width}
                      onAddPole={addPole}
                      ref={polePlotRef}/>
            <ButtonDiv>
                <button onClick={clear}>
                    Clear
                </button>
            </ButtonDiv>
            <Slider label="Feedback s0:"
                    width={width}
                    onChange={v => setFeedback(0, v)} />
            <Slider label="Feedback s1:"
                    width={width}
                    onChange={v => setFeedback(1, v)} />
            <Hide>
            <Slider label="Feedback s0,sn:"
                    width={width}
                    onChange={v => setFeedback(2, v)} />
            </Hide>
        </AppDiv>
    );
}

const AppDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;  
  border: solid 1px olive;
  border-radius: 10px;
  box-shadow: 0 0 5px olive;
  width: 720px;
`;

const ButtonDiv = styled.div`
  display: flex;
  margin: 10px;
  align-items: start;
`;

const Hide = styled.div`
  display: None;
`;

// Lysenko's root finder returns separate real and imaginary arrays.
// Zip'm.
const polyRoots = poly => {
    const rootsRI = findRoots(poly);
    return rootsRI[0].map((r, i) => [r, rootsRI[1][i]]);
}

// Multiply polynomial arrays.
const polyMultiply = (p1, p2) => {
    const result = Array(p1.length + p2.length - 1).fill(0.0);
    for (let i = 0; i < p1.length; i++) {
	for (let j = 0; j < p2.length; j++) {
	    result[i + j] += p1[i] * p2[j];
	}
    }
    return result;
}

export default PoleDance;
