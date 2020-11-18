import React from "react";
import { SvgIcon } from '@material-ui/core';

function queryAll(db, query, params) {
    let stmt = db.prepare(query, params);
    let result = [];
    while (stmt.step()) {
        result.push(stmt.getAsObject());
    }
    stmt.free();
    return result;
}

function queryAllAsArray(db, query, params) {
    let stmt = db.prepare(query, params);
    let result = { columns: stmt.getColumnNames(), values: [] };
    while (stmt.step()) {
        result.values.push(stmt.get());
    }
    stmt.free();
    return result;
}

function makeSvgIcon(code) {
    return React.forwardRef((props, ref) => {
        return <SvgIcon ref={ref} {...props}>
            {code}
        </SvgIcon>
    });
}

const PodiumIcon = makeSvgIcon(
    <>
        <path d="m 9,13 a 1,1 0 0 0 -1,1 v 1 H 3 a 1,1 0 0 0 -1,1 v 5 a 1,1 0 0 0 1,1 h 6 6 6 a 1,1 0 0 0 1,-1 v -4 a 1,1 0 0 0 -1,-1 h -5 v -2 a 1,1 0 0 0 -1,-1 z m 1,2 h 4 v 2 3 h -4 v -4 z m -6,2 h 4 v 3 H 4 Z m 12,1 h 4 v 2 h -4 z" />
        <path d="M 12.000161,1.6501422 11.327714,3.0136344 10.57411,4.5374239 7.3877136,5.000934 9.6929716,7.2470267 9.1480576,10.42014 12.000161,8.9233882 14.850333,10.42014 14.307351,7.2470267 16.612609,5.000934 13.426213,4.5374239 Z m 0,3.3894176 0.428976,0.8690815 0.95843,0.139053 -0.693703,0.6759522 0.164248,0.9559896 -0.857951,-0.4519223 -0.85795,0.449991 0.164247,-0.9540583 -0.693703,-0.6759522 0.958431,-0.139053 zM 12.000161,1.6501422 11.327714,3.0136344 10.57411,4.5374239 7.3877136,5.000934 9.6929716,7.2470267 9.1480576,10.42014 12.000161,8.9233882 14.850333,10.42014 14.307351,7.2470267 16.612609,5.000934 13.426213,4.5374239 Z m 0,3.3894176 0.428976,0.8690815 0.95843,0.139053 -0.693703,0.6759522 0.164248,0.9559896 -0.857951,-0.4519223 -0.85795,0.449991 0.164247,-0.9540583 -0.693703,-0.6759522 0.958431,-0.139053 z" />
    </>
);

const BookIcon = makeSvgIcon(
    <>
        <path d="M 21,5 C 19.89,4.65 18.67,4.5 17.5,4.5 15.55,4.5 13.45,4.9 12,6 10.55,4.9 8.45,4.5 6.5,4.5 4.55,4.5 2.45,4.9 1,6 v 14.65 c 0,0.25 0.25,0.5 0.5,0.5 0.1,0 0.15,-0.05 0.25,-0.05 C 3.1,20.45 5.05,20 6.5,20 c 1.95,0 4.05,0.4 5.5,1.5 1.35,-0.85 3.8,-1.5 5.5,-1.5 1.65,0 3.35,0.3 4.75,1.05 0.1,0.05 0.15,0.05 0.25,0.05 0.25,0 0.5,-0.25 0.5,-0.5 V 6 C 22.4,5.55 21.75,5.25 21,5 Z M 6.5,6.5 C 5.3,6.5 4.1,6.65 3,7 V 18.5 C 4.01,18.15 5.3,18 6.5,18 c 1.7,0 4.15,0.65 5.5,1.5 1.35,-0.85 3.8,-1.5 5.5,-1.5 1.2,0 2.4,0.15 3.5,0.5 V 7 C 19.9,6.65 18.7,6.5 17.5,6.5 15.8,6.5 13.35,7.15 12,8 10.65,7.15 8.2,6.5 6.5,6.5 Z" style={{ fillRule: "evenodd" }} />
        <path d="M 6.5,10.5 C 5.62,10.5 4.77,10.59 4,10.76 V 9.24 C 4.79,9.09 5.64,9 6.5,9 8.2,9 9.74,9.29 11,9.83 v 1.66 C 9.87,10.85 8.3,10.5 6.5,10.5 Z m 4.5,1.99 v 1.66 C 9.87,13.51 8.3,13.16 6.5,13.16 5.62,13.16 4.77,13.25 4,13.42 V 11.9 c 0.79,-0.15 1.64,-0.24 2.5,-0.24 1.7,0 3.24,0.3 4.5,0.83 z m -4.5,1.84 c 1.7,0 3.24,0.29 4.5,0.83 v 1.66 C 9.87,16.18 8.3,15.83 6.5,15.83 5.62,15.83 4.77,15.92 4,16.09 v -1.52 c 0.79,-0.16 1.64,-0.24 2.5,-0.24 z" />
        <path d="m 17.5,10.5 c 0.88,0 1.73,0.09 2.5,0.26 V 9.24 C 19.21,9.09 18.36,9 17.5,9 15.8,9 14.26,9.29 13,9.83 v 1.66 c 1.13,-0.64 2.7,-0.99 4.5,-0.99 z M 13,12.49 v 1.66 c 1.13,-0.64 2.7,-0.99 4.5,-0.99 0.88,0 1.73,0.09 2.5,0.26 V 11.9 c -0.79,-0.15 -1.64,-0.24 -2.5,-0.24 -1.7,0 -3.24,0.3 -4.5,0.83 z m 4.5,1.84 c -1.7,0 -3.24,0.29 -4.5,0.83 v 1.66 c 1.13,-0.64 2.7,-0.99 4.5,-0.99 0.88,0 1.73,0.09 2.5,0.26 v -1.52 c -0.79,-0.16 -1.64,-0.24 -2.5,-0.24 z" />
    </>
);

const SealIcon = makeSvgIcon(
    <>
        <path d="m 17.909941,12.501539 a 0.6251406,0.6251406 0 0 0 -0.509414,0.863789 l 2.347735,5.788124 -2.901446,-0.937618 a 0.6251406,0.6251406 0 0 0 -0.745664,0.310079 l -1.306757,2.554452 -2.192696,-5.404218 a 0.6251406,0.6251406 0 0 0 -1.188633,0.08121 0.6251406,0.6251406 0 0 0 -0.13289,0.206719 L 9.2056057,21.072982 7.898848,18.525913 A 0.6251406,0.6251406 0 0 0 7.1531836,18.215834 l -2.9014452,0.937618 2.1557812,-5.300858 a 0.62585392,0.62585392 0 1 0 -1.1591014,-0.4725 l -2.6578126,6.541169 a 0.6251406,0.6251406 0 0 0 0.7751953,0.826875 l 3.661875,-1.181249 1.690664,3.285351 a 0.6251406,0.6251406 0 0 0 1.1369533,-0.0443 l 2.1410158,-5.28609 2.148398,5.286093 a 0.6251406,0.6251406 0 0 0 1.136954,0.0443 l 1.690663,-3.285351 3.661875,1.181249 a 0.6251406,0.6251406 0 0 0 0.775195,-0.826875 L 18.559629,12.90021 a 0.6251406,0.6251406 0 0 0 -0.649688,-0.398671 z" />
        <path d="M 9.5629336,0.64810921 C 9.4494883,0.63094421 9.3372676,0.63583221 9.2269559,0.66959521 8.3441634,0.94028141 8.4463413,2.7848847 7.6935611,3.3144569 6.9406319,3.8443191 5.2126518,3.1430394 4.6638839,3.878982 4.1152853,4.6146479 5.2906911,6.0602738 4.9998631,6.9301447 4.708861,7.8004712 2.9030818,8.2369932 2.8980382,9.1569854 c -0.00431,0.9185526 1.7943666,1.4110016 2.0764313,2.2893496 0.2816274,0.879215 -0.9075308,2.288154 -0.3672334,3.041396 0.5410196,0.751794 2.2796072,0.09913 3.0238155,0.656331 0.7470554,0.551566 0.6269584,2.392651 1.5060477,2.691742 0.8797327,0.297784 1.8904307,-1.24546 2.8167577,-1.230622 0.929969,0.0076 1.922538,1.580818 2.805038,1.310711 l -0.0059,0.01368 c 0.882807,-0.27069 0.780614,-2.117255 1.533394,-2.646827 0.752125,-0.528271 2.480908,0.173372 3.029675,-0.56257 0.548672,-0.73581 -0.624853,-2.181291 -0.334026,-3.051163 0.291003,-0.870327 2.094843,-1.306841 2.099872,-2.2268409 C 21.08621,8.523624 19.287543,8.0292212 19.005478,7.1508739 18.72382,6.2718055 19.91378,4.8632308 19.372753,4.1114326 18.831734,3.3596382 17.093147,4.0122966 16.348938,3.4551005 15.601882,2.9035348 15.721964,1.062442 14.842891,0.76335801 13.963156,0.46557211 12.953189,2.0054205 12.026132,1.9920271 11.21879,1.9727291 10.357052,0.76827131 9.5629336,0.64810921 Z M 11.973391,3.7461527 c 3.134561,0 5.692117,2.5575526 5.692117,5.6921175 1e-6,3.1345658 -2.557556,5.6862578 -5.692117,5.6862578 -3.1345602,0 -5.684304,-2.551692 -5.684304,-5.6862578 0,-3.1345649 2.5497438,-5.6921175 5.684304,-5.6921175 z m 0,1.0040315 c -2.5940527,0 -4.6802722,2.0940233 -4.6802722,4.688086 -3e-7,2.5940248 2.0862195,4.6822268 4.6802722,4.6822268 2.594053,0 4.688086,-2.088202 4.688086,-4.6822268 0,-2.5940627 -2.094033,-4.688086 -4.688086,-4.688086 z" />
    </>
);

const BottomIcon = makeSvgIcon(
    <path d="M 19,3 H 5 C 3.89,3 3,3.9 3,5 v 14 c 0,1.1 0.89,2 2,2 h 14 c 1.1,0 2,-0.9 2,-2 V 5 C 21,3.9 20.1,3 19,3 Z M 17,17 H 7 v -2 h 4 V 7 h 2 v 8 h 4 z" />
)
// without box: <path d="M 3,21 v -2 H 11 V 5 h 2 V 19 H 21 V 21 z" />

// from https://materialdesignicons.com/icon/counter TODO attribute somewhere
const CounterIcon = makeSvgIcon(
    <path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H11V6H4M20,18V6H18.76C19,6.54 18.95,7.07 18.95,7.13C18.88,7.8 18.41,8.5 18.24,8.75L15.91,11.3L19.23,11.28L19.24,12.5L14.04,12.47L14,11.47C14,11.47 17.05,8.24 17.2,7.95C17.34,7.67 17.91,6 16.5,6C15.27,6.05 15.41,7.3 15.41,7.3L13.87,7.31C13.87,7.31 13.88,6.65 14.25,6H13V18H15.58L15.57,17.14L16.54,17.13C16.54,17.13 17.45,16.97 17.46,16.08C17.5,15.08 16.65,15.08 16.5,15.08C16.37,15.08 15.43,15.13 15.43,15.95H13.91C13.91,15.95 13.95,13.89 16.5,13.89C19.1,13.89 18.96,15.91 18.96,15.91C18.96,15.91 19,17.16 17.85,17.63L18.37,18H20M8.92,16H7.42V10.2L5.62,10.76V9.53L8.76,8.41H8.92V16Z" />
)

const MeasureIcon = makeSvgIcon(
    <g fill="none" stroke="currentColor" strokeWidth="2px" strokeLinecap="round">
        <path d="m 16,18 v 2 M 4,16 v 4 H 20 V 16 M 8,18 v 2 m 4,-4 v 4" />
        <path d="m 5.5,8 -2,2 2,2 m -2,-2 h 5" />
        <path d="m 18.5,8 2,2 -2,2 m 2,-2 h -5" />
    </g>
)

// from https://thenounproject.com/term/castle/1850215 TODO attribute somewhere
const CastleIcon = makeSvgIcon(
    <path fill="currentColor" stroke="none" d="M 19.680622,2 H 17.96553 C 17.6424,2 17.368979,2.25096 17.368979,2.57721 v 0.70261 c 0,0.82813 -1.640521,0.82813 -1.640521,0 V 2.57721 C 15.728458,2.25104 15.455036,2 15.131904,2 h -1.71509 c -0.323133,0 -0.571696,0.25096 -0.571696,0.57721 v 0.70261 c 0,0.82813 -1.665379,0.82813 -1.665379,0 V 2.57721 C 11.179739,2.25104 10.931168,2 10.608043,2 H 8.8680958 C 8.5449659,2 8.2963995,2.25096 8.2963995,2.57721 v 0.70261 c 0,0.85319 -1.6405217,0.82813 -1.6405217,0 V 2.57721 C 6.6558778,2.25104 6.3824561,2 6.0593244,2 H 4.3442346 C 4.021101,2 3.7476811,2.25096 3.7476811,2.57721 v 3.36256 c 0,0.82813 0.6462648,1.4304 1.4416712,1.4304 V 22 h 5.2944087 v -2.30868 c 0,-2.03262 3.032479,-2.03262 3.032479,0 V 22 h 5.294408 V 7.37017 c 0.795403,0 1.441671,-0.62737 1.441671,-1.4304 V 2.57721 C 20.252319,2.25104 20.003747,2 19.680622,2 Z M 10.110914,16.17822 H 7.9484098 v -1.40534 c 0,-1.43039 2.1625042,-1.43039 2.1625042,0 z m 0,-5.34507 H 7.9484098 V 9.42789 c 0,-1.4304 2.1625042,-1.4304 2.1625042,0 z m 5.940676,5.34507 h -2.162504 v -1.40534 c 0,-1.43039 2.162504,-1.43039 2.162504,0 z m 0,-5.34507 H 13.889086 V 9.42789 c 0,-1.4304 2.162504,-1.4304 2.162504,0 z" />
)

export { queryAll, queryAllAsArray, BookIcon, BottomIcon, CastleIcon, CounterIcon, MeasureIcon, PodiumIcon, SealIcon };
