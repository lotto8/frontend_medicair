import React, { useEffect, useState } from 'react'

//antd
import { Button, Card, Typography, Switch, Modal } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

//img
import bg from "./assets/img/bg.jpg"

const App = () => {

    //antd
    const { Title } = Typography;
    const { Text } = Typography;
    const { confirm } = Modal;

    //state
    const [state, setState] = useState({
        access_token: "",
        skills: [],
        users: []
    })

    //component did mount
    useEffect(() => {
        getBPToken()
    }, [])

    //modale successo
    const success = () => {
        Modal.success({
            title: 'Operazione avvenuta con successo!',
        });
    };

    //modale errore
    const notSuccess = () => {
        Modal.error({
            title: 'Errore, fare refresh della pagina!',
        });
    };

    //chiedo token a BP per autenticare le richieste
    const getBPToken = async () => {
        try {
            let response = await fetch('http://18.185.183.93:82/BPToken', {
                method: 'get'
            });
            let data = await response.json()
            console.log("TOKEN: ", data)
            getAllUsers(data.access_token)
        }
        catch (error) {
            notSuccess()
        }
    }

    //chiedo tutti gli utenti a BP
    const getAllUsers = async (access_token) => {
        let url = 'http://18.185.183.93:82/BPAllUsers?access_token=' + access_token
        try {
            let response = await fetch(url, {
                method: 'get',
            });
            let data = await response.json();
            data = data.map((el) => {
                return el.loginId
            })
            console.log("ALL USERS: ", data)
            getAllUserData(data, access_token)
        }
        catch (error) {
            notSuccess()
        }
    }

    //chiedo a BP i dati di tutti gli utenti
    const getAllUserData = async (users, access_token) => {
        let responses = []
        try {
            for (let i = 0; i < users.length; i++) {
                let response = await fetch('http://18.185.183.93:82/BPGetUserData?access_token=' + access_token + '&user=' + users[i], {
                    method: 'get'
                });
                let data = await response.json();
                let data_skills = data.skills
                let skills = []
                for (let s in data_skills) {
                    skills.push({
                        skill: s,
                        value: data_skills[s]
                    })
                }
                responses.push(skills)
            }

            let skills = []
            responses.forEach((resp) => {
                resp.forEach((el) => {
                    if (skills.includes(el.skill) === false)
                        skills.push(el.skill)
                })
            })

            skills = skills.map((el) => {
                return ({
                    skill: el,
                    value: 0
                }
                )
            })
            console.log("SKILLS: ", skills)
            getUserData(skills, users, access_token)
        }
        catch (error) {
            notSuccess()
        }
    }

    //chiedo a BP i dati dell'utente loggato
    const getUserData = async (skills, users, access_token) => {
        try {
            let response = await fetch("http://18.185.183.93:82/BPGetUserData?access_token=" + access_token + "&user=" + "admin", {
                method: 'get'
            });
            let data = await response.json();

            let data_skills = data.skills
            let user_skill = []
            for (let s in data_skills) {
                user_skill.push({
                    skill: s,
                    value: data_skills[s]
                })
            }

            user_skill.forEach((u_skill)=>{
                if(u_skill.value === 100){
                    skills.forEach((skill)=>{
                        if(u_skill.skill === skill.skill)
                            skill.value = 100
                    })
                }
            })

            console.log("GETUSERDATA: ", skills)
        }
        catch (error) {
            notSuccess()
        }
        setState({
            ...state,
            access_token: access_token,
            skills: skills,
            users: users
        })
    }

    //funzione che gestisce il toggle dello switch
    const onChangeSwitch = (value) => (checked) => {
        let skills = state?.skills
        skills = skills.map((el) => {
            if (el.skill === value) {
                if (checked)
                    el.value = 100
                else
                    el.value = 0
            }
            return el
        })

        setState({
            ...state,
            skills: skills
        })
    };

    //onClick bottone di conferma
    const update = async () => {
        let temp = {}
        for (let i = 0; i < state?.skills?.length; i++)
            if (state?.skills[i]?.skill.includes(" ") === false)
                temp[state?.skills[i]?.skill] = state?.skills[i]?.value

        temp = JSON.stringify(temp)

        try {
            let response = await fetch('http://18.185.183.93:82/BPUpdateUser?access_token=' + state?.access_token + '&user=' + "admin" + '&skills=' + temp, {
                method: 'get',
            });
            console.log("UPDATE USER: ",response.statusText)
            if (response.statusText === "OK")
                success()
            else
                notSuccess()
        }
        catch (error) {
            notSuccess()
        }
    }

    //funzione che gestisce il modal di conferma
    const showConfirm = () => {
        confirm({
            title: "Procedere con l'aggiornamento?",
            icon: <ExclamationCircleFilled />,
            okText: "Conferma",
            cancelText: "Annulla",
            onOk() {
                update()
            },
            onCancel() {
            },
        });
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            minHeight: '100vh',
            backgroundImage: `url(${bg})`,
            backgroundSize: 'cover',
            paddingTop: '5%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>

            <Title style={{ color: 'white' }}>SERVICES SETTING</Title>

            <Card title="Setta qui i tuoi servizi" bordered={false} style={{ width: '25%', marginTop: '2%' }}>
                {
                    state?.skills?.map((el, key) => {
                        return (
                            <div key={key} style={{ width: '100%', display: 'flex', marginBottom: '10px' }}>
                                <div style={{ width: '50%', display: 'flex', justifyContent: 'flex-end', paddingRight: '10%' }}>
                                    <Text>{el.skill}</Text>
                                </div>
                                <div style={{ width: '50%', display: 'flex', paddingLeft: '10%' }}>
                                    <Switch checked={el.value === 100 ? true : false} onChange={onChangeSwitch(el.skill)} />
                                </div>
                            </div>
                        )
                    })
                }
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5%' }}>
                    <Button type="primary" onClick={showConfirm}>AGGIORNA</Button>
                </div>
            </Card >
        </div >
    )
}

export default App