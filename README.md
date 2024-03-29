# Project of Data Visualization (COM-480)

| Student's name | SCIPER |
| -------------- | ------ |
| MAILLARD Alexandre|296188 |


[Milestone 1](#milestone-1) • [Milestone 2](#milestone-2) • [Milestone 3](#milestone-3)

## Milestone 1 (29th March, 5pm)  <a id="milestone-1"></a>

**10% of the final grade**

This is a preliminary milestone to let you set up goals for your final project and assess the feasibility of your ideas.
Please, fill the following sections about your project.

*(max. 2000 characters per section)*

### Dataset

For this project i'll use 4 different datasets (maybe more if needed)that will enable me to tackle all the aspects essential to answering the problem. 

- **Climate Change Earth Surface Temperature Data :**
    - ***Description :*** 
        - Global Land and Ocean-and-Land Temperatures (GlobalTemperatures.csv)
        - Global Average Land Temperature by Country (GlobalLandTemperaturesByCountry.csv)
        - Global Average Land Temperature by State (GlobalLandTemperaturesByState.csv)
        - Global Land Temperatures By Major City (GlobalLandTemperaturesByMajorCity.csv)
        - Global Land Temperatures By City (GlobalLandTemperaturesByCity.csv)
    - ***Utility :*** Using the global temperature by country files to visualize the global warming progression. This will be just use to illustrate in introduction and conclusion with a map visualization. 
    - ***Quality :*** Good quality, well explained, few NaNs and few lines not useful
    - ***Preprocessing require :*** Remove useless lines, remove or replace NaN for some case. 
    - *[Link](https://www.kaggle.com/datasets/berkeleyearth/climate-change-earth-surface-temperature-data?select=GlobalLandTemperaturesByCountry.csv)* 
- **Global Energy Consumption & Renewable Generation :**
    - ***Description :*** These datasets outline the quantity of terawatt hours (TWh) produced through various sources of energy, comparing both renewable and non-renewable sources for each country or region. 
    - ***Utility :*** I'll use this dataset to see the global consumption of energy, see the proportion of the production from non-renewable source and from renewable, illustrate by country the distribution of the source and calculate the quantity of renewable power is needed to replace non-renewable. 
    - ***Quality :*** Good quality, Few NaNs
    - ***Preprocessing require :*** Only some few NaNs to remove or replace. 
    - *[Link](https://www.kaggle.com/datasets/jamesvandenberg/renewable-power-generation)*

- **Gobal Material Flows :**
    - ***Description :*** This datasets contains the production, extraction, consumption, import and export ressource data (mineral or not) from each country from 1970 to 2024.
    - ***Utility :*** See the minerals production/extraction by country, control the possibility of replacing fossil fuels with renewable energies depending on the quantity of ore. Look at what such a transition would entail from the point of view of minerals.
    - ***Quality :*** Very Good quality, very well explained and complete but a bit too big. 
    - ***Preprocessing require :*** Remove Nans, select only what i want, remove the rest to reduce the size of the dataset. 
    - *[Link](https://www.resourcepanel.org/global-material-flows-database)*  : (National 13+ categories material flows +  National material totals and ratios)

- **Open database on global coal and metal mine production :**
    - ***Description :*** This data set covers global extraction and production of coal and metal ores on an individual mine level.
    - ***Utility :*** See the reserves of each mineral, calculate the carbon impact of transport (Import/Export), processing and other mineral activities. Look at the impact of mines on the landscape and the country (depending on size, etc.).
    - ***Quality :*** Quiet Good, lot of information, not everything will be usefull but there is some very good data not easy to find on private mine. 
    - ***Preprocessing require :*** Select what is interesting for the project and remove the rest to reduce the size of the dataset. Remove Nans and clean the data.
    - *[Link](https://zenodo.org/records/6325109)*  

### Problematic

How can we talk about energy transition without taking into account all the conditions and prerequisites necessary for its realization? These days, there's a lot of talk about global warming, its consequences and what we need to do to limit it. One of the main focuses is energy transition, i.e. replacing fossil fuels with renewable energies. Yet there's very little talk about what it takes to build a wind turbine or how to make a solar panel. In this project, I'm going to look at the minerals needed for this energy transition, and try to answer the question: is an energy transition to renewable energies a solution for decarbonizing our society, or is it just a way of outsourcing the problem? 
This question can be used to show what is at stake in this transition in terms of global warming, and how fossil fuels can be offset by renewable energies. Many visualizations can be made of the impact that minerals have on the planet, from extraction to power stations. Finally, the feasibility of such a transition can be seen, both in terms of mineral reserves and the carbon footprint required. 

Ecology is one of the most important fields for the next few years, and we're hearing a lot about it. It is therefore interesting to try to understand all aspects of this problem and to make information accessible to everyone without having to be a scientist. 

The audience for this project will be anyone concerned by ecology, from the novice to the researcher. It's a broad field that touches and concerns a huge number of people. 

### Exploratory Data Analysis

> 
> 

### Related work

Talking about global warming and energy transition isn't very original these days. In fact, every day, numerous associations and/or environmental movements publish new reports on these fields, each just as comprehensive as the next, and each with beautiful visualizations. The Shift Project, for example, is a French association that publishes numerous reports on the decarbonization of our economy. Despite this, there have been few reports on the importance of minerals in this transition and their carbon footprint. It's an angle of approach that seems to me to be quite original, breaking away a little from projects that only show that climate change and its consequences do indeed exist. What's more, it's a subject that's going to become increasingly important as reserves run out, and it's going to be urgent to deal with it in depth.  

The datasets presented above have already been used in numerous global warming projects. Most of these projects simply stop at a global analysis of the dataset and a few visualizations, as can be seen with the two datasets found on Kaggle (626 notebooks for one and 8 for the second). On the other hand, I haven't found any project linking these different datasets or subjects to make a related analysis.

The Shift Project and other environmental associations are a great source of inspiration for me. Dealing with similar subjects and presenting reports that aim to reach as many people as possible, they produce visualizations that are highly relevant, complex and at the same time easy to understand for the novice. There are numerous visualizations of the world, energies and industries - just take a stroll through the D3.js library site to find some inspiring examples for my project. 


---
## Milestone 2 (26th April, 5pm) <a id="milestone-2"></a>

**10% of the final grade**


## Milestone 3 (31st May, 5pm) <a id="milestone-3"></a>

**80% of the final grade**


## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone

