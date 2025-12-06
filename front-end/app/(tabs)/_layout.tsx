import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; //import bottom tab navigator
import HomeScreen from './home'; //import the Home screen component for the main tab navigation
import ProfileScreen from './profile'; //import the Profile screen component
import AddMenuScreen from './add'; //import the Add Menu screen component
import AddMenuButton from '../components/Modal'; //import the custom Add Menu Button component for modal
import SettingsScreen from './settings';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import HomePageStyled from './homeStyled';
//create a navigator object, use to define screens
const Tab = createBottomTabNavigator();

const COLORS = {
  tabIconSelected: Colors.default.primaryBlue,
  tabIconDefault: Colors.default.darkGray,
};

const TabsLayout = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: COLORS.tabIconSelected,
        tabBarInactiveTintColor: COLORS.tabIconDefault,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <MaterialIcons
              name="home"
              size={28}
              color={focused ? COLORS.tabIconSelected : COLORS.tabIconDefault}
            />
          ),
        }}
      />
      <Tab.Screen
        name="HomeStyled"
        component={HomePageStyled}
        options={{
          headerShown: false,
          tabBarLabel: 'HomeStyled',
          tabBarIcon: ({ focused }) => (
            <MaterialIcons
              name="home"
              size={28}
              color={focused ? COLORS.tabIconSelected : COLORS.tabIconDefault}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddMenuScreen} // empty screen
        options={{
          tabBarButton: () => <AddMenuButton />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <MaterialIcons
              name="person"
              size={28}
              color={focused ? COLORS.tabIconSelected : COLORS.tabIconDefault}
            />
          ),
        }}
      />
      <Tab.Screen
      name= "Settings"
      component={SettingsScreen}
      options = {{
        tabBarLabel: 'Settings',
        tabBarIcon: ({ focused }) => (
          <MaterialIcons
          name = "settings"
          size = {28}
          color = { focused ? COLORS.tabIconSelected: COLORS.tabIconDefault}
          />
        ),
      }}
      />
    </Tab.Navigator>
  );
};
export default TabsLayout;
