import React, { Component } from 'react';
import '../containers/Ideas.css'
import axiosClient from '../axiosClient';

class IdeaForm2 extends Component {

  constructor(props) {
    super(props)

    this.state = {
      selectedImagesFiles: [],
      submitFormProgress: 0,
      isSubmittingForm: false,
      didFormSubmissionComplete: false,
      idea: {
        id: this.props.match.params.id,
        title: '',
        description: '',
        errors: {}
      }
    };
  }

  componentWillMount() {
  if (this.props.match.params.id) {
    fetch(`/ideas/${this.props.match.params.id}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        this.setState({
          selectedImagesFiles: response.data.images,
          idea: {
            id: response.data.id,
            title: response.data.title,
            description: response.data.description,
            errors: {}
          }
        });
      });
    }
  }

  handleCancel() {
    this.props.history.push('/ideas');
  }

  handleFormSubmit() {
  let { image } = this.state;
  image.errors = {};
  this.setState(
    {
      isSubmittingForm: true,
      image: image
    },
    () => {
      this.submitForm();
    }
  );
}

buildFormData() {
  let formData = new FormData();
  formData.append('idea[title]', this.state.idea.title);
  formData.append('idea[description]', this.state.idea.description);

  let { selectedImagesFiles } = this.state;
  for (let i = 0; i < selectedImagesFiles.length; i++) {
    let file = selectedImagesFiles[i];
    if (file.id) {
      if (file._destroy) {
        formData.append(`idea[images_attributes][${i}][id]`, file.id);
        formData.append(`idea[images_attributes][${i}][_destroy]`, '1');
      }
    } else {
      formData.append(
        `idea[images_attributes][${i}][photo]`,
        file,
        file.name
      );
    }
  }
  return formData;
}

submitForm() {
  let submitMethod = this.state.idea.id ? 'patch' : 'post';
  let url = this.state.idea.id
    ? `/ideas/${this.state.idea.id}.json`
    : '/ideas.json';

  axiosClient
    [submitMethod](url, this.buildFormData(), {
      onUploadProgress: progressEvent => {
        let percentage = progressEvent.loaded * 100.0 / progressEvent.total;
        this.setState({
          submitFormProgress: percentage
        });
      }
    })
    .then(response => {
      this.setState({
        didFormSubmissionComplete: true
      });
      this.props.history.push('/ideas');
    })
    .catch(error => {
      let { idea } = this.state;
      idea.errors = error.response.data;
      this.setState({
        isSubmittingForm: false,
        submitFormProgress: 0,
        idea: idea
      });
    });
  }

  handleIdeaTitleChange(e) {
    let { idea } = this.state;
    idea.title = e.target.value;
    this.setState({ idea: idea });
  }

  handleIdeaDescriptionChange(e) {
    let { idea } = this.state;
    idea.description = e.target.value;
    this.setState({ idea: idea });
  }

renderIdeaTitleInlineError() {
  if (this.state.idea.errors.title) {
    return (
      <div className="inline-error alert alert-danger">
        {this.state.idea.errors.title.join(', ')}
      </div>
    );
  } else {
    return null;
  }
}

renderIdeaDescriptionInlineError() {
  if (this.state.idea.errors.description) {
    return (
      <div className="inline-error alert alert-danger">
        {this.state.idea.errors.description.join(', ')}
      </div>
    );
  } else {
    return null;
  }
}

getNumberOfSelectedFiles() {
  return this.state.selectedImagesFiles.filter(el => {
    return el._destroy !== true;
  }).length;
}

renderUploadImagesButton() {
  let numberOfSelectedImages = this.getNumberOfSelectedFiles();
  return (
    <div>
      <input
        name="images[]"
        ref={field => (this.ideaImagesField = field)}
        type="file"
        disabled={this.state.isSubmittingForm}
        multiple={true}
        accept="image/*"
        style={{
          width: 0.1,
          height: 0.1,
          opacity: 0,
          overflow: 'hidden',
          position: 'absolute',
          zIndex: -1
        }}
        id="idea_images"
        onChange={e => this.handleIdeaImagesChange(e)}
        className="form-control"
      />
      <label
        disabled={this.state.isSubmittingForm}
        className="btn btn-success"
        htmlFor="idea_images">
        <span className="glyphicon glyphicon-cloud-upload" />
        &nbsp; &nbsp;
        {numberOfSelectedImages === 0
          ? 'Upload Files'
          : `${numberOfSelectedImages} file${numberOfSelectedImages !== 1
              ? 's'
              : ''} selected`}
      </label>
    </div>
  );
}

handleIdeaImagesChange() {
  let selectedFiles = this.ideaImagesField.files;
  let { selectedImagesFiles } = this.state;
  for (let i = 0; i < selectedFiles.length; i++) {
    selectedImagesFiles.push(selectedFiles.item(i));
  } //end for

  this.setState(
    {
      selectedImagesFiles: selectedImagesFiles
    },
    () => {
      this.ideaImagesField.value = null;
    }
  );
}

renderSelectedImagesFiles() {
  let fileDOMs = this.state.selectedImagesFiles.map((el, index) => {
    if (el._destroy) { // we use _destroy to mark the removed photo
      return null;
    }

    return (
      <li key={index}>
        <div className="photo">
          <img
            width={150}
            src={el.id ? el.url : URL.createObjectURL(el)}
            style={{ alignSelf: 'center' }}
          />
          <div
            className="remove"
            onClick={() => this.removeSelectedIdeaImageFile(el, index)}>
            <span style={{ top: 2 }} className="glyphicon glyphicon-remove" />
          </div>
        </div>
        <div className="file-name">
          {el.name}
        </div>
      </li>
    );
  });

  return (
    <ul className="selected-images">
      {fileDOMs}
    </ul>
  );
}

removeSelectedIdeaImageFile(image, index) {
  let { selectedImagesFiles } = this.state;
  if (image.id) { // cover file that has been uploaded will be marked as destroy
    selectedImagesFiles[index]._destroy = true;
  } else {
    selectedImagesFiles.splice(index, 1);
  }

  this.setState({
    selectedImagesFiles: selectedImagesFiles
  });
}

renderUploadFormProgress() {
  if (this.state.isSubmittingForm === false) {
    return null;
  }

  return (
    <div className="progress">
      <div
        className={
          'progress-bar progress-bar-info progress-bar-striped' +
          (this.state.submitFormProgress < 100 ? 'active' : '')
        }
        role="progressbar"
        aria-valuenow={this.state.submitFormProgress}
        areaValuemin="0"
        areaValuemax="100"
        style={{ width: this.state.submitFormProgress + '%' }}>
        {this.state.submitFormProgress}% Complete
      </div>
    </div>
  );
}

  render() {
    return (
      <div className="BookForm">
      <form>
        <div className="form-group">
          <label>Title</label>
          <input className="form-control" type="text" onChange={e => this.handleIdeaTitleChange(e)}
            value={this.state.idea.title} />
          {this.renderIdeaTitleInlineError()}
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea className="form-control" type="text" onChange={e => this.handleIdeaDescriptionChange(e)}
            value={this.state.idea.description} />
          {this.renderIdeaDescriptionInlineError()}
        </div>
        <div className="form-group">
          <label>Images</label>
          {this.renderUploadImagesButton()}
          {this.renderSelectedImagesFiles()}
        </div>
        {this.renderUploadFormProgress()}

        <button className="btn btn-primary" disabled={this.state.isSubmittingForm}
          onClick={e => this.handleFormSubmit()}>
          {this.state.isSubmittingForm ? 'Saving...' : 'Save'} </button>
          &nbsp;
        <button className="btn btn-default" disabled={this.state.isSubmittingForm}
          onClick={e => this.handleCancel()}>
          Cancel </button>

          </form>
        <br />
      </div>
    );
  }
}
export default IdeaForm2;
