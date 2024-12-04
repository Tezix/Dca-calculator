import React, { useState } from 'react';
import './App.css';

function App() {
  const [inputs, setInputs] = useState({
    availableAmount: '',
    firstBuyPrice: '',
    lastBuyPrice: '',
    stopLossPrice: '',
    numberOfPositions: 3, // Default to 4
    totalBuys: 4, // Default to 3
    buyPercentages: '40,27,17,16', // Default percentages
  });

  const [results, setResults] = useState(null);

  // State variable to control the visibility of optional fields
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // New state variable to track long or short position
  const [isLong, setIsLong] = useState(true); // true for long, false for short

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const togglePosition = () => {
    setIsLong(!isLong);
    // Optionally, clear the results when position type changes
    setResults(null);
  };

  const calculateResults = () => {
    const {
      availableAmount,
      firstBuyPrice,
      lastBuyPrice,
      stopLossPrice,
      numberOfPositions,
      totalBuys,
      buyPercentages,
    } = inputs;

    // Convert inputs to numbers
    const available = parseFloat(availableAmount);
    const positions = parseInt(numberOfPositions);
    const investment = available / positions; // Investment amount per position
    const riskPercent = 100 / positions; // Risk percentage per position
    const riskAmount = (riskPercent / 100) * available; // Risk amount per position
    const firstPrice = parseFloat(firstBuyPrice);
    const stopLoss = parseFloat(stopLossPrice);
    let lastPrice = parseFloat(lastBuyPrice);
    let buys = parseInt(totalBuys);

    // Validation
    if (
      isNaN(available) ||
      isNaN(firstPrice) ||
      isNaN(stopLoss) ||
      isNaN(positions)
    ) {
      alert('Please fill in all required fields with valid numbers.');
      return;
    }

    if (positions <= 0) {
      alert('Number of Positions must be at least 1.');
      return;
    }

    // For long positions, stopLoss should be less than firstPrice
    // For short positions, stopLoss should be greater than firstPrice
    if (isLong && firstPrice <= stopLoss) {
      alert('Stop Loss Price must be less than the First Buy Price for long positions.');
      return;
    }

    if (!isLong && firstPrice >= stopLoss) {
      alert('Stop Loss Price must be greater than the First Buy Price for short positions.');
      return;
    }

    // Check if lastBuyPrice is empty or invalid
    if (isNaN(lastPrice) || lastBuyPrice === '') {
      lastPrice = firstPrice;
      buys = 1;
    }

    // Parse buy percentages
    let percentagesArray;
    if (buys === 1) {
      percentagesArray = [100];
    } else {
      percentagesArray = buyPercentages
        .split(',')
        .map((p) => parseFloat(p.trim()));
    }

    // Validate percentages
    const totalPercentage = percentagesArray.reduce((a, b) => a + b, 0);
    if (totalPercentage !== 100) {
      alert('The sum of buy percentages must equal 100%.');
      return;
    }

    if (percentagesArray.length !== buys) {
      alert(
        `The number of buy percentages (${percentagesArray.length}) does not match the total buys (${buys}).`
      );
      return;
    }

    // Calculate limit order prices and amounts
    let priceInterval = 0;
    if (buys > 1) {
      priceInterval = (lastPrice - firstPrice) / (buys - 1);
    }

    const limitOrders = [];
    let totalQuantity = 0; // Total quantity purchased
    for (let i = 0; i < buys; i++) {
      const price = firstPrice + priceInterval * i;
      const amountInvested = (investment * (percentagesArray[i] / 100)).toFixed(2);
      const quantity = amountInvested / price;
      totalQuantity += quantity;
    
      limitOrders.push({
        price: price.toFixed(4), // Changed to 4 decimal places
        amountInvested: amountInvested,
        percentage: percentagesArray[i],
        quantity: quantity,
      });
    }

    // Calculate average entry price
    const averagePrice = (investment / totalQuantity).toFixed(4);

    // Calculate the required Leverage using average price
    let priceDifference;
    if (isLong) {
      priceDifference = averagePrice - stopLoss;
      if (priceDifference <= 0) {
        alert('Stop Loss Price must be less than the Average Entry Price for long positions.');
        return;
      }
    } else {
      priceDifference = stopLoss - averagePrice;
      if (priceDifference <= 0) {
        alert('Stop Loss Price must be greater than the Average Entry Price for short positions.');
        return;
      }
    }

    const leverageValue = (
      (riskAmount / investment) *
      (averagePrice / priceDifference)
    ).toFixed(2);

    // Total potential risk across all positions
    const totalRiskAmount = (riskAmount * positions).toFixed(2);

    setResults({
      leverage: `${leverageValue}x`,
      limitOrders,
      investmentAmount: investment.toFixed(2),
      riskAmount: riskAmount.toFixed(2),
      totalRiskAmount,
      averagePrice,
      riskPercent: riskPercent.toFixed(2),
      positionType: isLong ? 'Long' : 'Short',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    calculateResults();
  };

  const handleClearForm = () => {
    setInputs({
      availableAmount: inputs.availableAmount,
      firstBuyPrice: '',
      lastBuyPrice: '',
      stopLossPrice: '',
      numberOfPositions: 3, // Default to 4
      totalBuys: 3, // Default to 3
      buyPercentages: '40,30,30', // Default percentages
    });
    setResults(null); // Clear the results
  };

  return (
    <div className="container">
      <div className="button-row">
        <button
          type="button"
          className="half-button clear-button"
          onClick={handleClearForm}
        >
          🔄
        </button>
        <button
          type="button"
          className={`half-button position-button ${isLong ? 'long' : 'short'}`}
          onClick={togglePosition}
        >
          {isLong ? 'Long' : 'Short'}
        </button>
      </div>
      <hr />
      <form onSubmit={handleSubmit}>
        {/* Required Fields */}
        <label>
          <input
            type="number"
            name="availableAmount"
            value={inputs.availableAmount}
            onChange={handleChange}
            required
            placeholder="Available Amount"
          />
        </label>
        <label>
          <input
            type="number"
            name="firstBuyPrice"
            value={inputs.firstBuyPrice}
            onChange={handleChange}
            placeholder="Entry"
            required
          />
        </label>
        <label>
          <input
            type="number"
            name="lastBuyPrice"
            value={inputs.lastBuyPrice}
            onChange={handleChange}
            placeholder="Last Buy: Leave empty to use Entry"
          />
        </label>
        <label>
          <input
            type="number"
            name="stopLossPrice"
            value={inputs.stopLossPrice}
            onChange={handleChange}
            required
            placeholder="Stop Loss"
          />
        </label>

        <button type="submit">Calculate</button>
        {/* Display Results */}
        {results && (
          <div className="results">
            <h3>Limit Orders:</h3>
            <table>
              <thead>
                <tr>
                  <th>Price</th>
                  <th>Amount to Invest</th>
                  <th>Percentage of Investment</th>
                </tr>
              </thead>
              <tbody>
                {results.limitOrders.map((order, index) => (
                  <tr key={index}>
                    <td>${order.price}</td>
                    <td>${order.amountInvested}</td>
                    <td>{order.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              <strong>Leverage:</strong> {results.leverage}
            </p>

            <h2>Info</h2>
            <p>
              <strong>Position Type:</strong> {results.positionType}
            </p>
            <p>
              <strong>Average Entry Price:</strong> ${results.averagePrice}
            </p>
            <p>
              <strong>Investment Amount (per position):</strong> $
              {results.investmentAmount}
            </p>
            <p>
              <strong>Risk Percentage (per position):</strong>{' '}
              {results.riskPercent}%
            </p>
            <p>
              <strong>Risk Amount (per position):</strong> ${results.riskAmount}
            </p>
          </div>
        )}
        <hr />

        {/* Toggle Button for Optional Fields */}
        <button
          type="button"
          className="toggle-button"
          onClick={() => setShowOptionalFields(!showOptionalFields)}
        >
          {showOptionalFields ? 'Hide Optional Fields' : 'Show Optional Fields'}
        </button>

        {/* Optional Fields */}
        {showOptionalFields && (
          <div className="optional-fields">
            <label>
              Max Simultaneous Positions:
              <input
                type="number"
                name="numberOfPositions"
                value={inputs.numberOfPositions}
                onChange={handleChange}
                min="1"
                required
              />
            </label>
            <label>
              Total Entries:
              <input
                type="number"
                name="totalBuys"
                value={inputs.totalBuys}
                onChange={handleChange}
                min="1"
              />
            </label>
            <label>
              Buy Percentages (comma-separated):
              <input
                type="text"
                name="buyPercentages"
                value={inputs.buyPercentages}
                onChange={handleChange}
              />
            </label>
          </div>
        )}
      </form>
    </div>
  );
}

export default App;