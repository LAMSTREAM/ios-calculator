import {createContext, useContext, memo, useState} from "react";
import {useImmerReducer} from "use-immer";
import {divide, multiply, subtract, add, abs, format} from "mathjs";
import useSound from "use-sound";

import "./Calculator.css";
import audio from "../audio/clicksound.mp3";

function precessDisplayValue(st) {
  if (st === "0.") {
    return st;
  }

  let re_st = st;

  // Judge if need science notion
  if (st !== "0" && String(abs(st)).length > 9) {
    // trans to science notion and trunc
    re_st = format(Number(st), {notation: 'exponential'});
    let _a = re_st.split("e");
    let _len = 8 - _a[1].length;
    re_st = Number(_a[0]).toPrecision(_len) + "e" + _a[1];
  } else {
    if (st === +st && st !== (st | 0)) {
      // to check if st is float
      re_st = Number(st).toPrecision(9);
    }
  }

  // add comma to number
  let _s = "";
  let _m = re_st.indexOf("-e");
  let _n = re_st.indexOf("e");
  if (_m !== -1) {
    _s = re_st.slice(_m);
    re_st = re_st.slice(0,_m)
  } else if (_n !== -1) {
    _s = re_st.slice(_n);
    re_st = re_st.slice(0,_n)
  }
  let _a = re_st.split(".");
  let _b = _a[0];
  let commaNumber = Math.floor(_b.length / 3);
  let commaFirstIndex = _b.length % 3;
  for (let i = (commaNumber - 1) * 3 + commaFirstIndex; i > 0; i -= 3) {
    _b = _b.slice(0, i) + "," + _b.slice(i);
  }
  if (_a.length > 1) {
    re_st = _b + "." + _a[1];
  } else {
    re_st = _b;
  }

  return re_st + _s;
}

const CalculatorDisplay = memo(({value}) => {
  let className;
  let displayValue = precessDisplayValue(value);

  if (displayValue.replace(/[+|.]/gm, "").length <= 6) {
    className = " bigger-font";
  } else {
    className = " smaller-font";
  }

  return (
    <div className="display">
      <div className={"display-value" + className}>{displayValue}</div>
    </div>
  );
})

function CalculatorKey({type, children}) {
  const [keyClicked, setkeyClicked] = useState(0);
  const calState = useContext(CalStateContext);
  const dispatch = useContext(DispatchContext);
  const action = {
    type: type,
    value: children,
  };

  const [sound] = useSound(audio);

  let className = "button";
  if (type === "number" && children === "0") {
    className += " zero";
  } else if (
    type === "operator" &&
    calState.calState === "operator" &&
    children === calState.operator
  ) {
    className += " opclicked";
  } else if (type === "operator" && children === "=") {
    className += " equal";
  }

  function handleClick() {
    setkeyClicked(1);
    dispatch(action);
    sound();
  }

  return (
    <div
      onClick={handleClick}
      onAnimationEnd={() => {
        setkeyClicked(0);
      }}
      data-clicked={keyClicked}
      className={className}
    >
      {children}
    </div>
  );
}

export default function Calculator({height, width, basicFontSize}) {
  //The proportion of height, width and basicFontSize should be 15:8:1

  const [calState, dispatch] = useImmerReducer(calReducer, initialState);

  // calculate display area's value
  let displayedOperand = calState.firstOperand;
  if (calState.calState === "secondOperand") {
    displayedOperand = calState.secondOperand;
  }

  // calculate allClear button's value
  let allClearValue = "C";
  if (calState.calState === "firstOperand" && calState.firstOperand === "0") {
    allClearValue = "AC";
  }

  return (
    <div className="calculator" style={{height: height, width: width, fontSize: basicFontSize}}>
      <CalculatorDisplay value={displayedOperand}/>

      <CalStateContext.Provider value={calState}>
        <DispatchContext.Provider value={dispatch}>
          <div className="keypad">
            <div className="function-area">
              <CalculatorKey type={"allClear"}>{allClearValue}</CalculatorKey>
              <CalculatorKey type={"togglePolar"}>+/-</CalculatorKey>
              <CalculatorKey type={"percent"}>%</CalculatorKey>
            </div>
            <div className="operator-area">
              <CalculatorKey type={"operator"}>÷</CalculatorKey>
              <CalculatorKey type={"operator"}>×</CalculatorKey>
              <CalculatorKey type={"operator"}>-</CalculatorKey>
              <CalculatorKey type={"operator"}>+</CalculatorKey>
              <CalculatorKey type={"operator"}>=</CalculatorKey>
            </div>
            <div className="number-area">
              <CalculatorKey type={"number"}>0</CalculatorKey>
              <CalculatorKey type={"number"}>.</CalculatorKey>
              <CalculatorKey type={"number"}>1</CalculatorKey>
              <CalculatorKey type={"number"}>2</CalculatorKey>
              <CalculatorKey type={"number"}>3</CalculatorKey>
              <CalculatorKey type={"number"}>4</CalculatorKey>
              <CalculatorKey type={"number"}>5</CalculatorKey>
              <CalculatorKey type={"number"}>6</CalculatorKey>
              <CalculatorKey type={"number"}>7</CalculatorKey>
              <CalculatorKey type={"number"}>8</CalculatorKey>
              <CalculatorKey type={"number"}>9</CalculatorKey>
            </div>
          </div>
        </DispatchContext.Provider>
      </CalStateContext.Provider>
    </div>
  );
}

function calResult(firstOperand, operator, secondOperand) {
  let result;
  switch (operator) {
    case "÷": {
      result = divide(firstOperand, secondOperand);
      break;
    }
    case "×": {
      result = multiply(firstOperand, secondOperand);
      break;
    }
    case "-": {
      result = subtract(firstOperand, secondOperand);
      break;
    }
    case "+": {
      result = add(firstOperand, secondOperand);
      break;
    }
    default: {
      break;
    }
  }
  return String(result);
}

function calReducer(draft, action) {
  switch (action.type) {
    //number group
    case "number": {
      if (
        draft.calState === "firstOperand" ||
        draft.calState === "secondOperand"
      ) {
        if (draft[draft.calState] === "0" && action.value !== ".") {
          draft[draft.calState] = action.value;
        } else if (draft[draft.calState] === "-0" && action.value !== ".") {
          draft[draft.calState] = "-" + action.value;
        } else if (action.value === "." && draft[draft.calState].indexOf(".") !== -1) {
          break;
        } else {
          draft[draft.calState] = draft[draft.calState] + action.value;
        }
      } else if (draft.calState === "operator") {
        draft.secondOperand = action.value === "." ? "0." : action.value;
        draft.calState = "secondOperand";
      } else if (draft.calState === "postCalculate") {
        draft.firstOperand = action.value;
        draft.calState = "firstOperand";
      }
      break;
    }
    //function group
    case "allClear": {
      // AC or C
      if (
        draft.calState === "firstOperand" ||
        draft.calState === "postCalculate"
      ) {
        draft.firstOperand = "0";
        draft.calState = "firstOperand";
      } else if (draft.calState === "operator") {
        draft.operator = "";
        draft.calState = "firstOperand";
      } else if (draft.calState === "secondOperand") {
        if (draft.secondOperand === "0") {
          draft.secondOperand = "";
          draft.calState = "operator";
        } else {
          draft.secondOperand = "0";
        }
      }
      break;
    }
    case "togglePolar": {
      // +/-
      if (
        draft.calState === "firstOperand" ||
        draft.calState === "secondOperand"
      ) {
        if (draft[draft.calState][0] !== "-") {
          draft[draft.calState] = "-" + draft[draft.calState];
        } else {
          draft[draft.calState] = draft[draft.calState].slice(1);
        }
      } else if (draft.calState === "operator") {
        draft.secondOperand = "-0";
        draft.calState = "secondOperand";
      } else if (draft.calState === "postCalculate") {
        if (draft.firstOperand !== "-") {
          draft.firstOperand = "-" + draft.firstOperand;
        } else {
          draft.firstOperand = draft.firstOperand.slice(1);
        }
        draft.calState = "firstOperand";
      }
      break;
    }
    case "percent": {
      // %
      if (
        draft.calState === "firstOperand" ||
        draft.calState === "secondOperand"
      ) {
        draft[draft.calState] = String(
          divide(Number(draft[draft.calState]), 100)
        );
      } else if (draft.calState === "operator") {
        draft["firstOperand"] = String(
          divide(Number(draft["firstOperand"]), 100)
        );
      } else if (draft.calState === "postCalculate") {
        draft["firstOperand"] = String(
          divide(Number(draft["firstOperand"]), 100)
        );
        draft.calState = "firstOperand";
      }
      break;
    }
    //operator group
    case "operator": {
      if (action.value === "=") {
        if (draft.calState === "secondOperand") {
          draft.firstOperand = calResult(
            draft.firstOperand,
            draft.operator,
            draft.secondOperand
          );
          draft.secondOperand = "";
          draft.operator = "";
          draft.calState = "postCalculate";
        }
      } else {
        if (
          draft.calState === "firstOperand" ||
          draft.calState === "postCalculate" ||
          draft.calState === "operator"
        ) {
          draft.operator = action.value;
          draft.calState = "operator";
        } else if (draft.calState === "secondOperand") {
          draft.firstOperand = calResult(
            draft.firstOperand,
            draft.operator,
            draft.secondOperand
          );
          draft.secondOperand = "";
          draft.operator = action.value;
          draft.calState = "operator";
        }
      }
      break;
    }
    default: {
      break;
    }
  }
}

const initialState = {
  firstOperand: "0",
  secondOperand: "",
  operator: "",
  calState: "firstOperand", //["firstOperand", "secondOperand", "operator", "postCalculate"]
};

const CalStateContext = createContext(null);
const DispatchContext = createContext(null);
