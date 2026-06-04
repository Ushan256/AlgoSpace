import {
  formatOperations,
  getBurdenLevel,
  operationsForClass,
} from '../utils/complexityMath';

function InputScaleSlider({ timeComplexity, scaleN, onScaleChange }) {
  const operations = operationsForClass(timeComplexity, scaleN);
  const burden = getBurdenLevel(operations);
  const sliderPct = `${((scaleN - 1) / 99999) * 100}%`;

  return (
    <section className="input-scale-panel" aria-label="Input scale simulator">
      <div className="input-scale-header">
        <h4>Dynamic Input Scale (N)</h4>
        <span className={`burden-badge ${burden.colorClass}`}>{burden.label}</span>
      </div>
      <div className="input-scale-readout">
        <span className="input-scale-n">N = {formatOperations(scaleN)} elements</span>
        <span className="input-scale-burden">
          Simulated Burden: <strong>{formatOperations(operations)}</strong> Operations
        </span>
      </div>
      <div
        className="range-slider-wrap"
        style={{ '--slider-pct': sliderPct }}
      >
        <input
          type="range"
          className="n-range-slider"
          min={1}
          max={100000}
          step={1}
          value={scaleN}
          onChange={(e) => onScaleChange(Number(e.target.value))}
          aria-valuemin={1}
          aria-valuemax={100000}
          aria-valuenow={scaleN}
          aria-label="Input size N from 1 to 100000"
        />
        <div className="range-slider-labels">
          <span>1</span>
          <span>25K</span>
          <span>50K</span>
          <span>75K</span>
          <span>100K</span>
        </div>
      </div>
      <p className="input-scale-hint">
        Class <strong>{timeComplexity}</strong> at N={formatOperations(scaleN)} projects{' '}
        {formatOperations(operations)} primitive operations.
      </p>
    </section>
  );
}

export default InputScaleSlider;
