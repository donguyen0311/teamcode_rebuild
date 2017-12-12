const express = require('express');
const app = express();
const config = require('../server/config/development');
const logger = require('morgan');
const mongoose = require('mongoose');
const Company = require('../server/models/company');
const Project = require('../server/models/project');
const User = require('../server/models/user');
const helper = require('../server/helper');
const _ = require('underscore');
const slug = require('vietnamese-slug');

const company = {
    company_name: 'demo',
    address: '345 abc',
    description: `Lorem Ipsum is simply dummy text of the printing and typesetting industry. 
                    Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, 
                    when an unknown printer took a galley of type and scrambled it to make a type specimen book.`,
    field: 'Software',
    created_by: '5a1bc409a94d0a339cde190d',
}

const project_1 = {
    project_name: 'Project 1',
    budget: 6000,
    deadline: new Date(),
    description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    language_programming: ['PHP', 'Python'],
    level: 123,
    belong_company: '5a1bc4ef5671cd2fa8beb87f',
    created_by: '5a1bc409a94d0a339cde190d',
    users: ['5a1bc409a94d0a339cde190d', '5a1bc52a06575f2bd8b89904']
}

const project_2 = {
    project_name: 'Project 2',
    budget: 8000,
    deadline: new Date(),
    description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Ha galley of type and scrambled it to make a ty',
    language_programming: ['PHP', 'Javascript'],
    level: 1234,
    belong_company: '5a1bc4ef5671cd2fa8beb87f',
    created_by: '5a1bc409a94d0a339cde190d',
    users: ['5a1bc409a94d0a339cde190d']
}

const MALE = 1;
const FEMALE = 0;

const LAST_NAMES = ['Nguyễn','Trần','Lê','Phạm','Huỳnh','Phan','Võ','Đặng','Bùi','Đỗ','Hồ','Ngô','Dương','Lý'];
const MIDDLE_NAMES = {
  [FEMALE]: ['Xuân','Thị','Cẩm','Châu','Hồng','Phương Bảo','Hạnh','Thu','Kim','Kiều Hương','Hoàng','Tố','Anh'],
  [MALE]: ['Thanh','Minh','Bá','Nhật Đăng','Thành','Văn','Bảo Thái','Đình','Đại','Đức','Ngọc Minh','Hoàng','Kim','Anh']
}
const FIRST_NAMES = {
  [FEMALE]: ['Hạnh','Thảo','Hiền','Dung','An','Hà','Khánh','Tú','Linh','Lương','Tâm','Thanh','Lan'],
  [MALE]: ['Dung','Cương','Cường','Tú','Phú','Bình','Quý','Kim','Lương','Tâm','Danh','Đạt','Thanh','Hùng','Tráng','An','Dũng','Bình','Khánh']
};

function getRandomPerson(){
    let gender = Math.round(Math.random());
    let first_name = FIRST_NAMES[gender][Math.round(Math.random()*(FIRST_NAMES[gender].length-1))];
    let middle_name = MIDDLE_NAMES[gender][Math.round(Math.random()*(MIDDLE_NAMES[gender].length-1))];
    let last_name = LAST_NAMES[Math.round(Math.random()*(LAST_NAMES.length-1))];
    let fullname = last_name+' '+middle_name+' '+first_name;
    return {
        lastname: last_name,
        middlename: middle_name,
        firstname: first_name,
        username: getNameAbbreviate(fullname),
        gender: gender
    }
}

function getNameAbbreviate(fullname)
{
    let result;
    let nameElements = fullname.split(' ');
    let first_name = nameElements[nameElements.length-1];
    result = slug(first_name.toLowerCase());

    nameElements.forEach((nameElement,index) => {
        if(index+1 >= nameElements.length)
            return result;
        else
        {
            result+=slug(nameElement.toLowerCase().charAt(0));
        }
    });

    return result;
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

mongoose.connect(`mongodb://${encodeURIComponent(config.mongo.user)}:${encodeURIComponent(config.mongo.pass)}@${config.database_url}?authSource=${config.mongo.authSource}`, {
    useMongoClient: true
}).then(
    () => console.log('Connected Database'),
    err => {
        throw err;
    }
);
app.use(logger('dev'));

app.post('/init_user', async (req, res) => {
    var users = [];
    for (var i = 0; i < 1; i++) {
        var person = getRandomPerson();
        users.push({
            email: `${person.username}${i}@gmail.com`,
            firstname: person.firstname,
            lastname: person.lastname+' '+person.middlename,
            gender: person.gender,
            username: `${person.username}${i}`,
            password: `${person.username}${i}!`,
            analyst_capability: getRandomIntInclusive(0, 5),
            programmer_capability: getRandomIntInclusive(0, 5),
            personnel_continuity: getRandomIntInclusive(0, 5),
            application_experience: getRandomIntInclusive(0, 5),
            platform_experience: getRandomIntInclusive(0, 5),
            language_and_toolset_experience: getRandomIntInclusive(0, 5),
            salary: getRandomIntInclusive(300, 5000)
        })
    }
    var count = 1;
    for (let user of users) {
        var password_sha512 = helper.sha512(user.password);
        var newUser = new User({
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            gender: user.gender,
            username: user.username,
            password: password_sha512.password_encrypt,
            salt: password_sha512.salt,
            current_company: user.current_company,
            analyst_capability: user.analyst_capability,
            programmer_capability: user.programmer_capability,
            personnel_continuity: user.personnel_continuity,
            application_experience: user.application_experience,
            platform_experience: user.platform_experience,
            language_and_toolset_experience: user.language_and_toolset_experience,
            salary: user.salary
        });
        var success = await newUser.save();
        if (!success) {
            return res.json({
                success: false,
                message: 'Error occurred while saving user.'
            });
        }
        console.log(`Created ${count++} users`);
    }
    return res.json({
        success: true,
        message: "Created 1000 user successful."
    });
})

app.post('/fullname', async(req, res) => {
    var users = [];
    for (var i = 1; i <= 1000; i++) {
        var person = getRandomPerson();
        users.push({
            email: `${person.username}${i}@gmail.com`,
            firstname: person.firstname,
            lastname: person.lastname+' '+person.middlename,
            gender: person.gender,
            username: `${person.username}${i}`,
            password: `${person.username}${i}!`,
            current_company: '5a1bc4ef5671cd2fa8beb87f',
            analyst_capability: getRandomIntInclusive(0, 5),
            programmer_capability: getRandomIntInclusive(0, 5),
            personnel_continuity: getRandomIntInclusive(0, 5),
            application_experience: getRandomIntInclusive(0, 5),
            platform_experience: getRandomIntInclusive(0, 5),
            language_and_toolset_experience: getRandomIntInclusive(0, 5),
            salary: getRandomIntInclusive(300, 5000)
        })
    }
    var count = 1;
    for (let user of users) {
        var password_sha512 = helper.sha512(user.password);
        var newUser = new User({
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            gender: user.gender,
            username: user.username,
            password: password_sha512.password_encrypt,
            salt: password_sha512.salt,
            current_company: user.current_company,
            analyst_capability: user.analyst_capability,
            programmer_capability: user.programmer_capability,
            personnel_continuity: user.personnel_continuity,
            application_experience: user.application_experience,
            platform_experience: user.platform_experience,
            language_and_toolset_experience: user.language_and_toolset_experience,
            salary: user.salary
        });
        var success = await newUser.save();
        if (!success) {
            return res.json({
                success: false,
                message: 'Error occurred while saving user.'
            });
        }
        console.log(`Created ${count++} users`);
    }
    return res.json({
        success: true,
        message: "Created 1000 user successful."
    });
});

app.get('/companies', async(req, res) => {
    var company_result = await Company.findOne({
        company_name: company.company_name
    });
    if (company_result) {
        return res.json({
            success: false,
            message: 'Company name already exists.'
        });
    }
    var newCompany = new Company({
        company_name: company.company_name,
        address: company.address,
        description: company.description,
        field: company.field,
        created_by: company.created_by
    });
    var success = await newCompany.save();
    if (!success) {
        return res.json({
            success: false,
            message: 'Error occurred while saving company.'
        });
    }
    return res.json({
        success: true,
        message: "Create company successful."
    });
});

app.get('/projects', async (req, res) => {
    var newProject1 = new Project({
        project_name: 'Project 1',
        budget: 6000,
        deadline: new Date(),
        description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
        language_programming: ['PHP', 'Python'],
        level: 123,
        belong_company: '5a1bc4ef5671cd2fa8beb87f',
        created_by: '5a1bc409a94d0a339cde190d',
        users: ['5a1bc409a94d0a339cde190d', '5a1bc52a06575f2bd8b89904']
    });
    var newProject2 = new Project({
        project_name: 'Project 2',
        budget: 8000,
        deadline: new Date(),
        description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Ha galley of type and scrambled it to make a ty',
        language_programming: ['PHP', 'Javascript'],
        level: 1234,
        belong_company: '5a1bc4ef5671cd2fa8beb87f',
        created_by: '5a1bc409a94d0a339cde190d',
        users: ['5a1bc409a94d0a339cde190d']
    });
    var success1 = await newProject1.save();
    var success2 = await newProject2.save();
    if (!success1 && !success2) {
        return res.json({
            success: false,
            message: 'Error occurred while saving project.'
        });
    }
    return res.json({
        success: true,
        message: "Create project successful."
    });
});

app.get('/demoFilter', async(req, res) => {
    var users = await User.find({
            analyst_capability: {
                $gte: 3
            },
            programmer_capability: {
                $gte: 2
            },
            application_experience: {
                $gte: 4
            },
            platform_experience: {
                $gte: 2
            },
            language_and_toolset_experience: {
                $gte: 5
            }
        }, {
            password: false,
            salt: false
        })
        // .populate('current_company')
        .exec();
    var usersFilter = _.sortBy(users, 'salary').slice(0, 8);
    res.json({
        success: true,
        length: usersFilter.length,
        usersFilter
    })
})

app.get('/users', async(req, res) => {
    var users = await User.find({}).populate('current_company').exec();
    res.json({
        success: true,
        users
    })
})

app.post('/users', async(req, res) => {
    var users = [];
    for (var i = 1; i <= 1000; i++) {
        users.push({
            email: `donguyen${i}@gmail.com`,
            username: `donguyen${i}`,
            password: `Donguyen!${i}`,
            current_company: '5a0abda455a6fa2f882eb25a',
            analyst_capability: getRandomIntInclusive(0, 5),
            programmer_capability: getRandomIntInclusive(0, 5),
            personnel_continuity: getRandomIntInclusive(0, 5),
            application_experience: getRandomIntInclusive(0, 5),
            platform_experience: getRandomIntInclusive(0, 5),
            language_and_toolset_experience: getRandomIntInclusive(0, 5),
            salary: getRandomIntInclusive(300, 5000)
        })
    }
    var count = 1;
    for (let user of users) {
        var password_sha512 = helper.sha512(user.password);
        var newUser = new User({
            email: user.email,
            username: user.username,
            password: password_sha512.password_encrypt,
            salt: password_sha512.salt,
            current_company: user.current_company,
            analyst_capability: user.analyst_capability,
            programmer_capability: user.programmer_capability,
            personnel_continuity: user.personnel_continuity,
            application_experience: user.application_experience,
            platform_experience: user.platform_experience,
            language_and_toolset_experience: user.language_and_toolset_experience,
            salary: user.salary
        });
        var success = await newUser.save();
        if (!success) {
            return res.json({
                success: false,
                message: 'Error occurred while saving user.'
            });
        }
        console.log(`Created ${count++} users`);
    }
    return res.json({
        success: true,
        message: "Created 1000 user successful."
    });
});

// app.put('/users', async(req, res) => {
//     // var response = await User.update({}, {salary: getRandomIntInclusive(300, 5000)}, { multi: true }).exec();
//     // console.log(response);
//     // res.json({
//     //     response
//     // })
//     for (var i = 1; i <= 1000; i++) {
//         var response = await User.update({
//             username: `donguyen${i}`
//         }, {
//             salary: getRandomIntInclusive(300, 5000)
//         }).exec();
//         console.log(response);
//     }
//     res.json({
//         response: 'ok'
//     })
// })

app.post('/upgraded_users', async(req, res) => {
    var users = [];
    for (var i = 1; i <= 1000; i++) {
        var person = getRandomPerson();
        
        var LTEX = PCAP = getRandomIntInclusive(0, 4);
        var ACAP = getRandomIntInclusive((LTEX == 0) ? 0 : LTEX-1, LTEX+1);
        var PLEX = APEX = getRandomIntInclusive((LTEX == 0) ? 0 : LTEX-1, LTEX);
        var salary = 0;
        var office_hours = getRandomIntInclusive(0, 8);
        var overtime = (office_hours >= 6 ? getRandomIntInclusive(0, 4) : 0);
        switch(LTEX) {
            case 0:
                salary=getRandomIntInclusive(250,350);
                break;
            case 1:
                salary=getRandomIntInclusive(300,500);
                break;
            case 2:
                salary=getRandomIntInclusive(450,750);
                break;
            case 3:
                salary=getRandomIntInclusive(700,2500);
                break;
            case 4:
                salary=getRandomIntInclusive(2200,5000);
                break;
            default:
                break;
        }

        users.push({
            email: `${person.username}${i}@gmail.com`,
            firstname: person.firstname,
            lastname: person.lastname+' '+person.middlename,
            gender: person.gender,
            username: `${person.username}${i}`,
            password: `${person.username}${i}!`,
            current_company: '5a1bc4ef5671cd2fa8beb87f',
            analyst_capability: ACAP,
            programmer_capability: PCAP,
            personnel_continuity: getRandomIntInclusive(0, 4),
            application_experience: APEX,
            platform_experience: PLEX,
            language_and_toolset_experience: LTEX,
            salary: salary,
            work_time:{
                office: office_hours,
                overtime: overtime,
                projects:[
                    {
                        id: '5a1bcc820fe6401eb4d3904e',
                        work_time: {
                            office: office_hours,
                            overtime: overtime
                        }
                    }
                ]
            }
        });
        // console.log('was random '+i+' users');
    }
    // console.log(users);
    // return;
    var count = 1;
    for (let user of users) {
        var password_sha512 = helper.sha512(user.password);
        var newUser = new User({
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            gender: user.gender,
            username: user.username,
            password: password_sha512.password_encrypt,
            salt: password_sha512.salt,
            current_company: user.current_company,
            analyst_capability: user.analyst_capability,
            programmer_capability: user.programmer_capability,
            personnel_continuity: user.personnel_continuity,
            application_experience: user.application_experience,
            platform_experience: user.platform_experience,
            language_and_toolset_experience: user.language_and_toolset_experience,
            salary: user.salary,
            work_time: user.work_time
        });
        var success = await newUser.save();
        if (!success) {
            return res.json({
                success: false,
                message: 'Error occurred while saving user.'
            });
        }
        console.log(`Created ${count++} users`);
    }
    return res.json({
        success: true,
        message: "Created 500 user successful."
    });
});

var server = app.listen(config.port, config.hostname, () => {
    console.log(`Listening on ${config.hostname}:${config.port}`);
});
