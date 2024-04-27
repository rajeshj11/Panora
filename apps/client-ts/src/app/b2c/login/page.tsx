'use client';
import CreateUserForm from "@/components/Auth/CustomLoginComponent/CreateUserForm";
import LoginUserForm from "@/components/Auth/CustomLoginComponent/LoginUserForm";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"


export default async function Page() {
    return (
        <div className='min-h-screen grid lg:grid-cols-2 mx-auto text-left'>
            <div className='flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24'>
                <img src="/logo.png" className='w-14' /> 
                <Tabs defaultValue="login" className="w-[400px]">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="create">Create Account</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login">
                        <LoginUserForm/>
                    </TabsContent>
                    <TabsContent value="create">
                        <CreateUserForm/>
                    </TabsContent>
                </Tabs>
            </div>       
            <div className='hidden lg:block relative flex-1'>
                <img className='absolute inset-0 h-full w-full object-cover border-l' src="/bgbg.jpeg" alt='Login Page Image' />
            </div>
        </div>
    )
}
