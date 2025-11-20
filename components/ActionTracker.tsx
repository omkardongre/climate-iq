"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Target,
  Trophy,
  Flame,
  Star,
  CheckCircle,
  Plus,
  Calendar,
  Users,
  Award,
  Zap,
  Leaf,
  Globe,
  Heart,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import type { ACHIEVEMENT_TYPES } from "@/lib/constants"

interface Goal {
  id: string
  title: string
  description: string
  category: string
  target_value: number
  current_value: number
  unit: string
  deadline: string
  difficulty: "easy" | "medium" | "hard"
  points: number
  status: "active" | "completed" | "paused"
  action_type: "scan_based" | "daily_habit" | "weekly_challenge"
}

interface Achievement {
  id: string
  type: keyof typeof ACHIEVEMENT_TYPES
  title: string
  description: string
  icon: string
  earned_date?: string
  progress: number
  total: number
}

interface Challenge {
  id: string
  title: string
  description: string
  category: string
  duration: number
  participants: number
  reward_points: number
  start_date: string
  end_date: string
  joined: boolean
}

export function ActionTracker() {
  const [activeTab, setActiveTab] = useState("goals")
  const [streak, setStreak] = useState(7)
  const [loading, setLoading] = useState(true)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: "",
    category: "",
    target_value: 0,
    action_type: "daily_habit" as const
  })

  // Predefined goal templates that users can easily understand
  const goalTemplates = [
    {
      title: "Use Reusable Water Bottle",
      description: "Replace single-use plastic bottles with a reusable one",
      category: "waste",
      target_value: 7,
      unit: "days",
      action_type: "daily_habit",
      difficulty: "easy",
      points: 50
    },
    {
      title: "Walk/Bike Instead of Drive",
      description: "Choose eco-friendly transport for short trips",
      category: "transport", 
      target_value: 5,
      unit: "trips",
      action_type: "weekly_challenge",
      difficulty: "medium",
      points: 100
    },
    {
      title: "Eat Plant-Based Meals",
      description: "Choose vegetarian/vegan options to reduce food carbon footprint",
      category: "food",
      target_value: 10,
      unit: "meals",
      action_type: "weekly_challenge", 
      difficulty: "medium",
      points: 75
    },
    {
      title: "Reduce Food Waste",
      description: "Plan meals and use leftovers to minimize waste",
      category: "food",
      target_value: 7,
      unit: "days",
      action_type: "daily_habit",
      difficulty: "easy",
      points: 60
    }
  ]

  // Real data from Supabase
  const [goals, setGoals] = useState<Goal[]>([])
  
  // Calculate real stats from goals
  const totalPoints = goals.reduce((sum, goal) => {
    const progress = (goal.current_value / goal.target_value) * 100
    return sum + Math.floor(progress * (goal.points || 50) / 100)
  }, 0)
  
  const currentStreak = goals.filter(goal => goal.status === 'active').length
  const completedActions = goals.filter(goal => goal.status === 'completed').length

  // Load goals from API
  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/user-goals', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        const formattedGoals = data.goals.map((goal: any) => ({
          id: goal.id,
          title: goal.title,
          description: goal.title, // Use title as description for simplicity
          category: goal.category,
          target_value: goal.target_value,
          current_value: goal.current_value,
          unit: "kg CO2", // Default unit
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
          difficulty: "medium" as const,
          points: Math.floor(goal.target_value * 10), // Simple points calculation
        }))
        setGoals(formattedGoals)
      }
    } catch (error) {
      console.error('Failed to load goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const createGoalFromTemplate = async (template: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const goalData = {
        ...template,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
      }
      
      const response = await fetch('/api/user-goals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData)
      })

      if (response.ok) {
        await loadGoals() // Reload goals
        setShowAddGoal(false)
      } else {
        console.error('Failed to create goal:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to create goal:', error)
    }
  }

  const updateGoalProgress = async (goalId: string, newProgress: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/user-goals', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal_id: goalId,
          current_value: newProgress
        })
      })

      if (response.ok) {
        await loadGoals() // Reload goals
      }
    } catch (error) {
      console.error('Failed to update goal:', error)
    }
  }

  // Mock achievements for now
  const mockGoals: Goal[] = [
    {
      id: "1",
      title: "Reduce Transport Emissions",
      description: "Use public transport or bike for daily commute",
      category: "transport",
      target_value: 20,
      current_value: 15,
      unit: "days",
      deadline: "2024-02-28",
      difficulty: "medium",
      points: 150,
    },
    {
      id: "2",
      title: "Plant-Based Meals",
      description: "Eat plant-based meals to reduce food carbon footprint",
      category: "food",
      target_value: 30,
      current_value: 22,
      unit: "meals",
      deadline: "2024-02-15",
      difficulty: "easy",
      points: 100,
    },
    {
      id: "3",
      title: "Zero Waste Week",
      description: "Minimize waste production for one week",
      category: "waste",
      target_value: 7,
      current_value: 4,
      unit: "days",
      deadline: "2024-01-20",
      difficulty: "hard",
      points: 200,
    },
  ]

  // Always use real goals from database
  const displayGoals = goals

  // Calculate real achievements based on user data
  const achievements: Achievement[] = []
  
  // Add achievements based on actual user activity
  if (goals.length > 0) {
    achievements.push({
      id: "first_goal",
      type: "FIRST_GOAL",
      title: "Goal Setter",
      description: "Created your first climate action goal",
      icon: "🎯",
      earned_date: new Date().toISOString().split('T')[0],
      progress: 1,
      total: 1,
    })
  }
  
  const completedGoals = goals.filter(goal => goal.status === 'completed').length
  if (completedGoals > 0) {
    achievements.push({
      id: "goal_achiever",
      type: "GOAL_COMPLETE",
      title: "Goal Achiever",
      description: `Completed ${completedGoals} climate action goal${completedGoals > 1 ? 's' : ''}`,
      icon: "🏆",
      earned_date: new Date().toISOString().split('T')[0],
      progress: completedGoals,
      total: completedGoals,
    })
  }

  const challenges: Challenge[] = [
    {
      id: "1",
      title: "Bike to Work Week",
      description: "Cycle to work every day this week",
      category: "transport",
      duration: 7,
      participants: 156,
      reward_points: 300,
      start_date: "2024-01-15",
      end_date: "2024-01-21",
      joined: true,
    },
    {
      id: "2",
      title: "Zero Plastic Challenge",
      description: "Avoid single-use plastics for 30 days",
      category: "waste",
      duration: 30,
      participants: 89,
      reward_points: 500,
      start_date: "2024-01-01",
      end_date: "2024-01-31",
      joined: false,
    },
    {
      id: "3",
      title: "Local Food Month",
      description: "Buy only locally sourced food for one month",
      category: "food",
      duration: 30,
      participants: 234,
      reward_points: 400,
      start_date: "2024-02-01",
      end_date: "2024-02-29",
      joined: false,
    },
  ]

  // Real progress data based on goals
  const progressData = goals.length > 0 ? goals.map((goal, index) => ({
    week: `Goal ${index + 1}`,
    points: Math.floor((goal.current_value / goal.target_value) * (goal.points || 50)),
    actions: goal.current_value
  })) : [
    { week: "No Goals", points: 0, actions: 0 }
  ]

  // Real category data based on goals
  const categoryData = goals.length > 0 ? goals.reduce((acc: any[], goal) => {
    const existing = acc.find(item => item.category === goal.category)
    if (existing) {
      existing.actions += goal.current_value
      existing.points += Math.floor((goal.current_value / goal.target_value) * (goal.points || 50))
    } else {
      acc.push({
        category: goal.category,
        actions: goal.current_value,
        points: Math.floor((goal.current_value / goal.target_value) * (goal.points || 50))
      })
    }
    return acc
  }, []) : [
    { category: "No Data", actions: 0, points: 0 }
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "transport":
        return <Globe className="h-4 w-4" />
      case "energy":
        return <Zap className="h-4 w-4" />
      case "food":
        return <Leaf className="h-4 w-4" />
      case "waste":
        return <Target className="h-4 w-4" />
      default:
        return <Star className="h-4 w-4" />
    }
  }

  const completeGoal = async (goalId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/user-goals', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal_id: goalId,
          current_value: goals.find(g => g.id === goalId)?.target_value || 0,
          status: 'completed'
        })
      })

      if (response.ok) {
        // Update local state after successful database update
        setGoals(goals.map((goal) => (goal.id === goalId ? { ...goal, current_value: goal.target_value, status: 'completed' as const } : goal)))
      } else {
        console.error('Failed to complete goal:', response.status)
      }
    } catch (error) {
      console.error('Error completing goal:', error)
    }
  }

  const joinChallenge = (challengeId: string) => {
    // In real implementation, update Supabase database
    console.log("Joining challenge:", challengeId)
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Points</p>
                <p className="text-2xl font-bold text-blue-600">{totalPoints.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">from goal progress</p>
              </div>
              <Star className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Goals</p>
                <p className="text-2xl font-bold text-green-600">{goals.length}</p>
                <p className="text-xs text-gray-500 mt-1">climate actions</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Climate Actions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Choose simple daily actions to help the environment</p>
            </div>
            <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Action
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Choose Your Climate Action</DialogTitle>
                  <DialogDescription>Pick an easy action to start making a positive impact</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {goalTemplates.map((template, index) => (
                    <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => createGoalFromTemplate(template)}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(template.category)}
                          <div>
                            <CardTitle className="text-base">{template.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                template.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                template.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {template.difficulty}
                              </span>
                              <span className="text-xs text-gray-500">{template.points} points</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                        <p className="text-xs text-blue-600 font-medium">
                          Goal: {template.target_value} {template.unit}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddGoal(false)}>
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Active Goals */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              Active Actions ({goals.filter(g => g.status === 'active').length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.filter(goal => goal.status === 'active').map((goal) => (
                <Card key={goal.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(goal.category)}
                        <div>
                          <CardTitle className="text-base">{goal.title}</CardTitle>
                          <CardDescription className="text-xs">{goal.description}</CardDescription>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        goal.difficulty === "easy" ? "bg-green-100 text-green-700" :
                        goal.difficulty === "medium" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {goal.difficulty}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{goal.current_value}/{goal.target_value} {goal.unit}</span>
                      </div>
                      <Progress value={(goal.current_value / goal.target_value) * 100} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Due {new Date(goal.deadline).toLocaleDateString()}</span>
                        <span className="font-medium text-blue-600">{goal.points} pts</span>
                      </div>
                      <Button 
                        onClick={() => updateGoalProgress(goal.id, goal.current_value + 1)} 
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={goal.current_value >= goal.target_value}
                      >
                        {goal.current_value >= goal.target_value ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Ready to Complete!
                          </div>
                        ) : (
                          `✓ Did it today (+1 ${goal.unit})`
                        )}
                      </Button>
                      {goal.current_value >= goal.target_value && (
                        <Button 
                          onClick={() => completeGoal(goal.id)} 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          🎉 Mark as Completed
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Completed Goals */}
          {goals.filter(g => g.status === 'completed').length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Completed Actions ({goals.filter(g => g.status === 'completed').length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goals.filter(goal => goal.status === 'completed').map((goal) => (
                  <Card key={goal.id} className="border-l-4 border-l-green-500 bg-green-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(goal.category)}
                        <div>
                          <CardTitle className="text-base text-green-800">{goal.title}</CardTitle>
                          <CardDescription className="text-xs text-green-600">{goal.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Completed!</span>
                        </div>
                        <span className="text-sm font-medium text-green-600">+{goal.points} pts</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>


        <TabsContent value="progress" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Progress Analytics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Track your climate action journey over time</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Progress</CardTitle>
                <CardDescription>Points and actions completed over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="points" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="actions" stroke="#22c55e" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions by Category</CardTitle>
                <CardDescription>Your focus areas and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="actions" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Impact Summary</CardTitle>
              <CardDescription>Your environmental contribution this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <Leaf className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">85kg</p>
                  <p className="text-sm text-gray-600">CO₂ Saved</p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <Globe className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">42</p>
                  <p className="text-sm text-gray-600">Actions Completed</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">12</p>
                  <p className="text-sm text-gray-600">Goals Achieved</p>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <Heart className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-600">95%</p>
                  <p className="text-sm text-gray-600">Health Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
