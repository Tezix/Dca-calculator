// src/App.js
import React, { useState } from 'react';
import './App.css';

function App() {
  const [inputs, setInputs] = useState({
    availableAmount: '',
    firstBuyPrice: '',
    lastBuyPrice: '',
    stopLossPrice: '',
    riskPercentage: 5, // Default to 5%
    numberOfPositions: 4, // Default to 4
    totalBuys: 3, // Default to 3
    buyPercentages: '40,30,30', // Default percentages
  });

  const [results, setResults] = useState(null);

  // New state variable to control the visibility of optional fields
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const calculateResults = () => {
    const {
      availableAmount,
      firstBuyPrice,
      lastBuyPrice,
      stopLossPrice,
      riskPercentage,
      numberOfPositions,
      totalBuys,
      buyPercentages,
    } = inputs;

    // Convert inputs to numbers
    const available = parseFloat(availableAmount);
    const positions = parseInt(numberOfPositions);
    const investment = available / positions; // Investment amount per position
    const riskPercent = parseFloat(riskPercentage);
    const riskAmount = (riskPercent / 100) * available; // Risk per position is 5% of total balance
    const firstPrice = parseFloat(firstBuyPrice);
    const stopLoss = parseFloat(stopLossPrice);
    let lastPrice = parseFloat(lastBuyPrice);
    let buys = parseInt(totalBuys);

    // Validation
    if (
      isNaN(available) ||
      isNaN(firstPrice) ||
      isNaN(stopLoss) ||
      isNaN(riskPercent) ||
      isNaN(positions)
    ) {
      alert('Please fill in all required fields with valid numbers.');
      return;
    }

    if (positions <= 0) {
      alert('Number of Positions must be at least 1.');
      return;
    }

    if (firstPrice <= stopLoss) {
      alert('Stop Loss Price must be less than the First Buy Price.');
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

    // Calculate the required Leverage
    const leverageValue = (
      (riskAmount / investment) *
      (firstPrice / (firstPrice - stopLoss))
    ).toFixed(2);

    // Calculate limit order prices and amounts
    let priceInterval = 0;
    if (buys > 1) {
      priceInterval = (lastPrice - firstPrice) / (buys - 1);
    }

    const limitOrders = [];
    for (let i = 0; i < buys; i++) {
      const price = firstPrice + priceInterval * i;
      const amountInvested = ((investment * percentagesArray[i]) / 100).toFixed(2);
      limitOrders.push({
        price: price.toFixed(2),
        amountInvested: amountInvested,
        percentage: percentagesArray[i],
      });
    }

    // Total potential risk across all positions
    const totalRiskAmount = (riskAmount * positions).toFixed(2);

    setResults({
      leverage: `${leverageValue}x`,
      limitOrders,
      investmentAmount: investment.toFixed(2),
      riskAmount: riskAmount.toFixed(2),
      totalRiskAmount,
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
      riskPercentage: 5, // Default to 5%
      numberOfPositions: 4, // Default to 4
      totalBuys: 3,        // Default to 3
      buyPercentages: '40,30,30', // Default percentages
    });
    setResults(null); // Clear the results
  };

  return (
    <div className="container">
      <button type="button" className='clear-button' onClick={handleClearForm}>Clear Form</button>
      <h1>DCA Investment Calculator</h1>
      <form onSubmit={handleSubmit}>
        {/* Required Fields */}
        <label>
          Available Amount:
          <input
            type="number"
            name="availableAmount"
            value={inputs.availableAmount}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          First Buy Price:
          <input
            type="number"
            name="firstBuyPrice"
            value={inputs.firstBuyPrice}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Last Buy Price:
          <input
            type="number"
            name="lastBuyPrice"
            value={inputs.lastBuyPrice}
            onChange={handleChange}
            placeholder="Optional: Leave empty to use only First Buy Price"
          />
        </label>
        <label>
          Stop Loss Price:
          <input
            type="number"
            name="stopLossPrice"
            value={inputs.stopLossPrice}
            onChange={handleChange}
            required
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
            <strong>Investment Amount (per position):</strong> ${results.investmentAmount}
          </p>
          <p>
            <strong>Risk Amount (per position):</strong> ${results.riskAmount}
          </p>
          <p>
            <strong>Total Risk Amount (all positions):</strong> ${results.totalRiskAmount}
          </p>
          
        </div>
      )}
        <hr/>

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
              Number of Positions:
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
              Total Buys:
              <input
                type="number"
                name="totalBuys"
                value={inputs.totalBuys}
                onChange={handleChange}
                min="1"
              />
            </label>
            <label>
              Risk Percentage (%):
              <input
                type="number"
                name="riskPercentage"
                value={inputs.riskPercentage}
                onChange={handleChange}
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