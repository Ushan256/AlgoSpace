import { formatOperations, getOptimizationGap, operationsForClass } from '../utils/complexityMath';

function ComplexityGraph({
  userCoordinates,
  idealCoordinates,
  userLabel,
  idealLabel,
  timeComplexity,
  idealTimeComplexity,
  highlightN,
}) {
  if (!userCoordinates || userCoordinates.length === 0) {
    return null;
  }

  const padding = { top: 32, right: 32, bottom: 48, left: 60 };
  const width = 640;
  const height = 260;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const allPoints = [...userCoordinates, ...(idealCoordinates || [])];
  const maxInput = Math.max(
    ...allPoints.map((p) => p.input_size),
    highlightN || 1,
    10
  );
  const maxOps = Math.max(...allPoints.map((p) => p.operations), 1);

  const scaleX = (inputSize) => padding.left + (inputSize / maxInput) * chartWidth;
  const scaleY = (operations) =>
    padding.top + chartHeight - (operations / maxOps) * chartHeight;

  const toPolyline = (coords) =>
    coords.map((p) => `${scaleX(p.input_size)},${scaleY(p.operations)}`).join(' ');

  const yTicks = [0, Math.round(maxOps / 2), maxOps];
  const xTicks = userCoordinates.map((p) => p.input_size);

  const highlightOps = highlightN
    ? operationsForClass(timeComplexity, highlightN)
    : null;
  const highlightIdeal = highlightN
    ? operationsForClass(idealTimeComplexity, highlightN)
    : null;
  const gapInfo =
    highlightOps !== null && highlightIdeal !== null
      ? getOptimizationGap(highlightOps, highlightIdeal)
      : null;

  const gapPolygon =
    userCoordinates.length > 0 && idealCoordinates && idealCoordinates.length > 0
      ? (() => {
          const forward = userCoordinates
            .map((p, idx) => {
              const ideal = idealCoordinates[idx];
              if (!ideal) return '';
              return `${scaleX(p.input_size)},${scaleY(p.operations)}`;
            })
            .filter(Boolean)
            .join(' ');
          const backward = [...idealCoordinates]
            .reverse()
            .map((p) => `${scaleX(p.input_size)},${scaleY(p.operations)}`)
            .join(' ');
          return `${forward} ${backward}`;
        })()
      : '';

  return (
    <div className="graph-container graph-container-overlay">
      <div className="graph-overlay-header">
        <h4>Comparative Benchmark Chart</h4>
        {gapInfo && (
          <p className="graph-gap-stat">
            Optimization gap at N={formatOperations(highlightN)}:{' '}
            <strong>{formatOperations(gapInfo.gap)}</strong> extra operations (
            {gapInfo.ratio}× vs ideal)
          </p>
        )}
      </div>
      <svg
        className="graph-svg graph-svg-dual"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="User profile vs ideal benchmark efficiency"
      >
        <defs>
          <linearGradient id="gapFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0, 173, 181, 0.28)" />
            <stop offset="100%" stopColor="rgba(110, 231, 183, 0.08)" />
          </linearGradient>
        </defs>
        <line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={padding.left + chartWidth}
          y2={padding.top + chartHeight}
          stroke="#3a3a42"
          strokeWidth="1"
        />
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartHeight}
          stroke="#3a3a42"
          strokeWidth="1"
        />
        {yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line
              x1={padding.left}
              y1={scaleY(tick)}
              x2={padding.left + chartWidth}
              y2={scaleY(tick)}
              stroke="#2a2a30"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 8}
              y={scaleY(tick) + 4}
              textAnchor="end"
              fill="#8b8b96"
              fontSize="10"
            >
              {formatOperations(tick)}
            </text>
          </g>
        ))}
        {xTicks.map((tick) => (
          <text
            key={`x-${tick}`}
            x={scaleX(tick)}
            y={padding.top + chartHeight + 24}
            textAnchor="middle"
            fill="#8b8b96"
            fontSize="10"
          >
            {tick}
          </text>
        ))}
        {gapPolygon && (
          <polygon points={gapPolygon} fill="url(#gapFill)" stroke="none" opacity="0.85" />
        )}
        {idealCoordinates && idealCoordinates.length > 0 && (
          <>
            <polyline
              points={toPolyline(idealCoordinates)}
              fill="none"
              stroke="#6ee7b7"
              strokeWidth="2.5"
              strokeDasharray="8 5"
              strokeLinejoin="round"
            />
            {idealCoordinates.map((p) => (
              <circle
                key={`ideal-${p.input_size}`}
                cx={scaleX(p.input_size)}
                cy={scaleY(p.operations)}
                r="3.5"
                fill="#6ee7b7"
                stroke="#121214"
                strokeWidth="1.5"
              />
            ))}
          </>
        )}
        <polyline
          points={toPolyline(userCoordinates)}
          fill="none"
          stroke="#00adb5"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {userCoordinates.map((p) => (
          <circle
            key={`user-${p.input_size}`}
            cx={scaleX(p.input_size)}
            cy={scaleY(p.operations)}
            r="5"
            fill="#00adb5"
            stroke="#121214"
            strokeWidth="2"
          />
        ))}
        {highlightN && highlightOps !== null && (
          <>
            <line
              x1={scaleX(highlightN)}
              y1={padding.top}
              x2={scaleX(highlightN)}
              y2={padding.top + chartHeight}
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <circle
              cx={scaleX(highlightN)}
              cy={scaleY(highlightOps)}
              r="7"
              fill="#00adb5"
              stroke="#fbbf24"
              strokeWidth="2"
            />
            {highlightIdeal !== null && (
              <circle
                cx={scaleX(highlightN)}
                cy={scaleY(highlightIdeal)}
                r="6"
                fill="#6ee7b7"
                stroke="#121214"
                strokeWidth="1.5"
              />
            )}
          </>
        )}
        <text
          x={padding.left + chartWidth / 2}
          y={height - 10}
          textAnchor="middle"
          fill="#8b8b96"
          fontSize="11"
        >
          Input size (n)
        </text>
        <text
          x={18}
          y={padding.top + chartHeight / 2}
          textAnchor="middle"
          fill="#8b8b96"
          fontSize="11"
          transform={`rotate(-90, 18, ${padding.top + chartHeight / 2})`}
        >
          Operations
        </text>
      </svg>
      <div className="graph-legend graph-legend-dual">
        <span className="legend-user">
          <span className="legend-swatch legend-swatch-user" />
          {userLabel}
        </span>
        <span className="legend-ideal">
          <span className="legend-swatch legend-swatch-ideal" />
          {idealLabel}
        </span>
        <span className="legend-highlight">
          <span className="legend-swatch legend-swatch-highlight" />
          Live N marker
        </span>
      </div>
    </div>
  );
}

export default ComplexityGraph;
