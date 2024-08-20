const path = require("path");

let config = {
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                // exclude: [
                //     path.resolve(__dirname, 'src/modules/Player/')
                // ],
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
    plugins: [],
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
        // devServer: {
        //     historyApiFallback: {
        //         index: "test.html",
        //     },
        //     port: 8083,
        // },
    });
};
// Return Array of Configurations
module.exports = [mainConfig];
