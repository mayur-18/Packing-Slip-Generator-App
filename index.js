require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Import the cors package
const { createPackingSlip } = require('./packingSlip');
const axios = require('axios');

const app = express();
const port = 3000;

// Enable CORS for all routes

app.use(cors()); // Use CORS middleware

// Shopify API credentials
const shopifyUrl = `https://${process.env.SHOPIFY_STORE_URL}`;
const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_API_URL = 'https://dghtvs-mj.myshopify.com/admin/api/2024-10/shop.json';

// Middleware to parse JSON
app.use(express.json());

const archiver = require('archiver');
const { Readable } = require('stream');

app.get('/orders', async (req, res) => {
  try {
    const response = await axios.get(`${shopifyUrl}/admin/api/2024-10/orders.json?status=any`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    console.log(`Status Code: ${response.status}`);

    const shopResponse = await axios.get(SHOPIFY_API_URL, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    const shopData = shopResponse.data.shop;
    // console.log(shopData);

    if (response.data.orders && response.data.orders.length > 0) {
      const orderNames = response.data.orders.map((order) => order.name);
      // console.log(`Order Names: ${JSON.stringify(orderNames, null, 2)}`);

      const packingSlips = await Promise.all(
        response.data.orders.map(async (order) => {
          try {
            return await createPackingSlip(order, shopData);
          } catch (error) {
            console.error(`Error generating packing slip for order ${order.name}:`, error);
            return null;
          }
        })
      );

      // Create a zip stream
      const zip = archiver('zip');
      res.attachment('packing-slips.zip'); // Name of the zip file
      zip.pipe(res);

      // Append each PDF to the zip
      packingSlips.forEach((pdfData, index) => {
        if (pdfData) {
          zip.append(pdfData, { name: `packing-slip-${orderNames[index]}.pdf` });
        }
      });

      // Finalize the zip
      zip.finalize();
    } else {
      console.log('No orders found.');
      res.status(200).json([]);
    }
  } catch (error) {
    console.error('Error fetching orders:', error.response ? error.response.data : error.message);
    res.status(500).send('Error fetching orders');
  }
});



// Route to fetch product details from Shopify (unchanged)
app.get('/products', async (req, res) => {
  try {
    const response = await axios.get(`${shopifyUrl}/admin/api/2023-01/products.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken
      }
    });

    const products = response.data.products;
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching products');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
