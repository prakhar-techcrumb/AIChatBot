const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

let config = {
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-react"],
                    },
                },
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader", "postcss-loader"],
            },
        ],
    },
    optimization: {
        minimize: true,
        minimizer: [],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/index.html",
            filename: "index.html",
        }),
    ],
    resolve: {
        extensions: [".js", ".jsx"],
    },
};
let mainConfig = () => {
    return Object.assign({}, config, {
        context: __dirname,
        entry: "./src/index.js",
        output: {
            path: path.resolve(__dirname, "dist"),
            chunkFilename: "[name].js",
            filename: "main.js",
        },
        devServer: {
            historyApiFallback: true,
            port: 8080,
            static: {
                directory: path.join(__dirname, 'dist'),
            },
        }
    })
};
// Return Array of Configurations
module.exports = [mainConfig];
